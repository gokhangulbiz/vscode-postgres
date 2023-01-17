import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";

export class QueryResultNode implements INode {
  constructor(public readonly connection: IConnection
    , public readonly table_name: string
    , public readonly citus_table_type: string
    , public readonly distribution_column: string
    , public readonly colocation_id: string
    , public readonly table_size: string
    , public readonly shard_count: string)
  {}

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    let label = `${this.citus_table_type} ${this.table_name}`;
    let tooltip = `size: ${this.table_size}\n distribution column: ${this.distribution_column}`;
    return {
      label: label,
      tooltip: tooltip,
      collapsibleState: TreeItemCollapsibleState.None,
      contextValue: 'vscode-postgres.tree.function',
      iconPath: {
        light: path.join(__dirname, `../../resources/light/function.svg`),
        dark: path.join(__dirname, `../../resources/dark/function.svg`)
      }
    };
  }
  
  public getChildren(): INode[] | Promise<INode[]> {
    return [];
  }
}