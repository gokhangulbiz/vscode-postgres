import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from "../common/database";
import { InfoNode } from "./infoNode";
import { Global } from '../common/global';
import { FunctionFolderNode } from './funcFolderNode';
import { QueryResult } from 'pg';
import { SqlQueryManager } from '../queries';
import { ColumnNode } from './columnNode';

export class WorkerNode implements INode {

  constructor(private readonly connection: IConnection, public readonly workerName: string) {}
  
  public getTreeItem(): TreeItem {
    return {
      label: 'worker_' + this.workerName,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.worker',
      command: {
        title: 'select-database',
        command: 'vscode-postgres.setActiveConnection',
        arguments: [ this.connection ]
      },
      iconPath: {
        light: path.join(__dirname, '../../resources/light/server.svg'),
        dark: path.join(__dirname, '../../resources/dark/server.svg')
      }
    };
  }

  public async getChildren(): Promise<INode[]> { return []; }
}
