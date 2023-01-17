import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from '../common/database';
import { InfoNode } from './infoNode';
import { ColumnNode } from './columnNode';
import { Global } from '../common/global';
import { QueryResult } from 'pg';
import { SqlQueryManager } from '../queries';

export class TableNode implements INode {

  constructor(public readonly connection: IConnection
            , public readonly table: string
            , public readonly is_table: boolean
            , public readonly is_foreign: boolean
            , public readonly schema: string
            , public readonly citus_table_type?: string
            , public readonly distribution_column?: string
            , public readonly colocation_id?: string
            , public readonly table_size?: string
            , public readonly shard_count?: string)
            {}

  public getQuotedTableName(): string {
    let quotedSchema = this.schema && this.schema !== 'public' ? Database.getQuotedIdent(this.schema) : null;
    let quotedTable = Database.getQuotedIdent(this.table);
    return quotedSchema ? `${quotedSchema}.${quotedTable}` : quotedTable;
  }

  public getTreeItem(): TreeItem {
    let label = this.table;
    let tooltip = this.table;
    if(this.citus_table_type) {
      label = `${this.table} ( ${this.citus_table_type} )`
      tooltip = [
        `size: ${this.table_size}`,
        `colocation: ${this.colocation_id}`
      ].join('\n')

      if(this.citus_table_type.startsWith("distributed")){
        tooltip = [
          `distribution column: ${this.distribution_column}`,
          `shard count: ${this.shard_count}`
        ].join('\n').concat('\n').concat(tooltip)
      }
    }
    let iconName = 'table';
    if (this.is_table && this.is_foreign) iconName = 'fdw_table';
    else if (!this.is_table) iconName = 'view';
    return {
      label: label,
      tooltip: tooltip,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.table',
      iconPath: {
        light: path.join(__dirname, `../../resources/light/${iconName}.svg`),
        dark: path.join(__dirname, `../../resources/dark/${iconName}.svg`)
      }
    };
  }

  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);
    //config.get<boolean>("prettyPrintJSONfields") ? `.jsonb-field, .json-field { white-space: pre; }` : ``;
    const configSort = Global.Configuration.get<string>("tableColumnSortOrder");
    const sortOptions = {
      "db-order": 'a.attnum',
      "alpha": 'a.attname',
      "reverse-alpha": 'a.attname DESC'
    };
    if (!sortOptions[configSort]) sortOptions[configSort] = 'a.attnum';

    let tableSchema = this.schema ? this.schema : 'public';
    let query = SqlQueryManager.getVersionQueries(connection.pg_version);
    
    try {
      let res: QueryResult = null;

      // sorting is done via format - other fields through parameterized queries
      res = await connection.query(query.format(query.TableColumns, sortOptions[configSort]), [
        this.getQuotedTableName(),
        this.connection.database,
        tableSchema,
        this.table
      ])

      return res.rows.map<ColumnNode>(column => {
        return new ColumnNode(this.connection, this.table, column);
      });
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}