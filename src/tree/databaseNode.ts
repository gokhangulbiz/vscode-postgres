import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from '../common/database';
import { InfoNode } from './infoNode';
import { SchemaNode } from './schemaNode';
import { WorkerNode } from './workerNode';
import { RebalanceShardsNode } from './rebalanceShardsNode';

export class DatabaseNode implements INode {

  constructor(private readonly connection: IConnection) {}

  public getTreeItem(): TreeItem {
    return {
      label: this.connection.database,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.database',
      command: {
        title: 'select-database',
        command: 'vscode-postgres.setActiveConnection',
        arguments: [ this.connection ]
      },
      iconPath: {
        light: path.join(__dirname, '../../resources/light/database.svg'),
        dark: path.join(__dirname, '../../resources/dark/database.svg')
      }
    }
  }

  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);

    try {
      const res = await connection.query(`
      SELECT nspname as name
      FROM pg_namespace
      WHERE
        nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
        AND nspname not like 'pg_temp_%'
        AND nspname not like 'pg_toast_temp_%'
        AND has_schema_privilege(oid, 'CREATE, USAGE')
      ORDER BY nspname;`);

      // return res.rows.map<SchemaNode>(schema => {
      //   return new SchemaNode(this.connection, schema.name);
      // })
      const workers = await connection.query('select nodename, nodeport from pg_dist_node;');
      let childs = [];
      childs.push(new RebalanceShardsNode(this.connection));

      for (const worker in workers.rows)
      {
        childs.push(new WorkerNode(this.connection, worker));
      }

      // let childs = workers.rows.map<WorkerNode>(worker => {
      //   return new WorkerNode(this.connection, worker.nodeport);
      // });

      return childs.concat(res.rows.map<SchemaNode>(schema => {
        return new SchemaNode(this.connection, schema.name);
      }));
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}
