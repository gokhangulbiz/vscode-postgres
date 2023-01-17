import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";

export class RebalanceShardsNode implements INode {
  constructor(public readonly connection: IConnection)
  {}

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    let label = 'RebalanceShards';
    let tooltip = label;
    return {
      label: label,
      tooltip: tooltip,
      collapsibleState: TreeItemCollapsibleState.None,
      contextValue: 'vscode-postgres.tree.rebalance-shards',
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