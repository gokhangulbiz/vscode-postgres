import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from "../common/database";
import { TableNode } from "./tableNode";
import { InfoNode } from "./infoNode";
import { Global } from '../common/global';
import { FunctionFolderNode } from './funcFolderNode';
import { QueryResultFolderNode } from './queryResultFolderNode';

export class SchemaNode implements INode {

  constructor(private readonly connection: IConnection, public readonly schemaName: string) {}
  
  public getTreeItem(): TreeItem {
    return {
      label: this.schemaName,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.schema',
      command: {
        title: 'select-database',
        command: 'vscode-postgres.setActiveConnection',
        arguments: [ this.connection ]
      },
      iconPath: {
        light: path.join(__dirname, '../../resources/light/schema.svg'),
        dark: path.join(__dirname, '../../resources/dark/schema.svg')
      }
    };
  }

  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);
    const configVirtFolders = Global.Configuration.get<Array<string>>("virtualFolders");

    try {
      const res = await connection.query(`
      SELECT
        c.relname as "name",
        (c.relkind IN ('r', 'f')) as is_table,
        (c.relkind = 'f') as is_foreign,
        n.nspname as "schema",
        citus_tables.citus_table_type,
        citus_tables.distribution_column,
        citus_tables.colocation_id,
        citus_tables.table_size,
        citus_tables.shard_count
      FROM
        pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN citus_tables ON c.relname = citus_tables.table_name::text
      WHERE
        c.relkind in ('r', 'v', 'm', 'f')
        AND n.nspname = $1
        AND has_table_privilege(quote_ident(n.nspname) || '.' || quote_ident(c.relname), 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') = true
      ORDER BY
        c.relname;`, [this.schemaName]);

      let childs = [];
      if (configVirtFolders != null)
      {
        if (configVirtFolders.indexOf("functions") !== -1) {
          childs.push(new FunctionFolderNode(this.connection, this.schemaName));
        }
      }
      
      // childs.push(new QueryResultFolderNode(this.connection, this.schemaName));

      // Append tables under virtual folders
      return childs.concat(res.rows.map<TableNode>(table => {
        return new TableNode(
          this.connection,
          table.name,
          table.is_table,
          table.is_foreign,
          table.schema,
          table.citus_table_type,
          table.distribution_column,
          table.colocation_id,
          table.table_size,
          table.shard_count
        );
      }));
    } catch(err) {
      return [new InfoNode(err)];
    }
  }
}