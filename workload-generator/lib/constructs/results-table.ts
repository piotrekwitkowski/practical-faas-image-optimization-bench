import { RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface ResultsTableProps {
  tableName: string;
  writerRole: Role;
}

export class ResultsTable extends Table {
  constructor(scope: Construct, id: string, props: ResultsTableProps) {
    super(scope, id, {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'timestamp', type: AttributeType.NUMBER },
      removalPolicy: RemovalPolicy.RETAIN,
      tableName: props.tableName
    });
    this.grantWriteData(props.writerRole);
  }
}