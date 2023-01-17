import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from "../common/database";
import { QueryResultNode } from "./queryResultNode";
import { InfoNode } from "./infoNode";
import { SqlQueryManager } from '../queries';

export class QueryResultFolderNode implements INode {
  constructor(public readonly connection: IConnection
    , public readonly schemaName: string)
  {}

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    return {
      label: "Query Results",
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.function-folder',
      iconPath: {
        light: path.join(__dirname, `../../resources/light/func-folder.svg`),
        dark: path.join(__dirname, `../../resources/dark/func-folder.svg`)
      }
    };
  }
  
  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);

    try {
      let query = SqlQueryManager.getVersionQueries(connection.pg_version);
      const res = await connection.query(query.GetDistributedTables);

      return res.rows.map<QueryResultNode>(queryResult => {
        return new QueryResultNode(this.connection,
            queryResult.table_name,
            queryResult.citus_table_type,
            queryResult.distribution_column,
            queryResult.colocation_id,
            queryResult.table_size,
            queryResult.shard_count);
      })
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}