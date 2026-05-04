export interface ITerm {
  field: string;
  value: unknown;
  operator: "in" | "equals";
}

export interface IConjunction {
  conjunction: "each" | "any";
  terms: (ITerm | IConjunction)[];
}

export function processTermMongo(term: ITerm): object {
  let mongoOperator;

  switch (term.operator) {
    case "equals": {
      mongoOperator = "$eq";
      break;
    }
    case "in": {
      mongoOperator = "$in";
      break;
    }
  }

  return { [term.field]: { [mongoOperator]: term.value } };
}

export function proccessConjuctionMongo(
  termOrConjuction: ITerm | IConjunction,
): object {
  if ("field" in termOrConjuction) {
    return processTermMongo(termOrConjuction);
  }

  let mongoOperator;
  switch (termOrConjuction.conjunction) {
    case "any": {
      mongoOperator = "$or";
      break;
    }
    case "each": {
      mongoOperator = "$and";
      break;
    }
  }

  return {
    [mongoOperator]: termOrConjuction.terms.map((term) =>
      proccessConjuctionMongo(term),
    ),
  };
}

class StatementBuilder {
  public constructor(private conjunction: IConjunction) {}

  public each(f: (builder: StatementBuilder) => void) {
    const conjunction: IConjunction = { conjunction: "each", terms: [] };
    f(new StatementBuilder(conjunction));
    this.conjunction.terms.push(conjunction);
  }

  public any(f: (builder: StatementBuilder) => void) {
    const conjunction: IConjunction = { conjunction: "any", terms: [] };
    f(new StatementBuilder(conjunction));
    this.conjunction.terms.push(conjunction);
  }

  public in(field: string, value: unknown) {
    this.conjunction.terms.push({ field, value, operator: "in" });
  }

  public equals(field: string, value: unknown) {
    this.conjunction.terms.push({ field, value, operator: "equals" });
  }
}

interface IQueryBuilder {
  each: (f: (builder: StatementBuilder) => void) => IFinalQueryBuilder;
  any: (f: (builder: StatementBuilder) => void) => IFinalQueryBuilder;
}

interface IFinalQueryBuilder {
  mongo: () => Object | undefined;
}

class QueryBuilder implements IQueryBuilder, IFinalQueryBuilder {
  public conjuction: IConjunction | undefined = undefined;

  public each(f: (builder: StatementBuilder) => void): IFinalQueryBuilder {
    const conjunction: IConjunction = { conjunction: "each", terms: [] };
    const statemendBuilder = new StatementBuilder(conjunction);
    f(statemendBuilder);

    this.conjuction = conjunction;
    return this;
  }

  public any(f: (builder: StatementBuilder) => void): IFinalQueryBuilder {
    const conjunction: IConjunction = { conjunction: "any", terms: [] };
    const statemendBuilder = new StatementBuilder(conjunction);
    f(statemendBuilder);

    this.conjuction = conjunction;
    return this;
  }

  public mongo() {
    if (this.conjuction === undefined) {
      return;
    }
    return proccessConjuctionMongo(this.conjuction);
  }
}

export default QueryBuilder;
