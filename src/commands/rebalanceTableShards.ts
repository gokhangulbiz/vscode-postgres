import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { Global } from '../common/global';
import { SqlQueryManager } from '../queries';
import { QueryResult } from "pg";
import { integer } from "vscode-languageclient";
import { MultiStepInput } from "../common/multiStepInput";
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { PgClient } from "../common/connection";

interface ShardTransferModeQuickPickItem extends vscode.QuickPickItem {
  mode: string
}

const shardTransferModeOptions: ShardTransferModeQuickPickItem[] = [
  {label: 'Auto', mode: 'auto'},
  {label: 'Force Logical', mode: 'force_logical'},
  {label: 'Block Writes', mode: 'block_writes'}
]

interface DrainOnlyQuickPickItem extends vscode.QuickPickItem {
  value: boolean
}

const drainOnlyOptions: DrainOnlyQuickPickItem[] = [
  {label: 'No', value: false},
  {label: 'Yes', value: true}
]

interface RebalanceStrategyQuickPickItem extends vscode.QuickPickItem {
  name: string
}

const rebalanceStrategyOptions: RebalanceStrategyQuickPickItem[] = [
  {label: 'By Shard Count', name: 'by_shard_count'},
  {label: 'By Disk Size', name: 'by_disk_size'}
]

export class rebalanceTableShardsCommand extends BaseCommand {
  readonly TITLE: string = 'Rebalance Table Shards';
  readonly TotalSteps: number = 4;

  async run(treeNode: any) {
    const args = {} as Partial<RebalanceTableShardsArgs>;
    if (!(await MultiStepInput.run(input => this.setRelation(input, args)))) {
      // command cancelled
      return;
    }

    let parameters = []
    if (args.relation) {
      parameters.push(`relation := '${args.relation}'`)
    }
    if (args.shard_transfer_mode) {
      parameters.push(`shard_transfer_mode := '${args.shard_transfer_mode}'`)
    }
    if (args.drain_only) {
      parameters.push(`drain_only := true`)
    }
    if (args.rebalance_strategy) {
      parameters.push(`rebalance_strategy := '${args.rebalance_strategy}'`)
    }
    const sql = `SELECT * FROM pg_catalog.rebalance_table_shards(${parameters.join(', ')});`
 
    return Database.runQuery(sql, vscode.window.activeTextEditor, treeNode.connection, true);
  }
    
  async setRelation(input: MultiStepInput, state: Partial<RebalanceTableShardsArgs>) {
    state.relation = await input.showInputBox({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      prompt: 'citus relation to rebalance',
      placeholder: '',
      ignoreFocusOut: true,
      value: (typeof state.relation === 'string') ? state.relation : null,
      validate: async (value) => '' 
    });
   return (input: MultiStepInput) => this.setShardTransferMode(input, state);
  }

  async setShardTransferMode(input: MultiStepInput, state: Partial<RebalanceTableShardsArgs>) {
    let active = shardTransferModeOptions.find(s => s.mode === state.shard_transfer_mode);
    state.shard_transfer_mode = await input.showQuickPick({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      placeholder: 'Shard Transfer Mode',
      ignoreFocusOut: true,
      items: shardTransferModeOptions,
      activeItem: active || undefined,
      convert: async (value: ShardTransferModeQuickPickItem) => value.mode
    });
    if (typeof state.shard_transfer_mode === 'undefined')
      state.shard_transfer_mode = 'auto';
    return (input: MultiStepInput) => this.setDrainOnly(input, state);
  }

  async setDrainOnly(input: MultiStepInput, state: Partial<RebalanceTableShardsArgs>) {
    let active = drainOnlyOptions.find(s => s.value === !!state.drain_only);
    state.drain_only = await input.showQuickPick({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      placeholder: 'Drain Only?',
      ignoreFocusOut: true,
      items: drainOnlyOptions,
      activeItem: active || undefined,
      convert: async (value: DrainOnlyQuickPickItem) => value.value
    });
    if (typeof state.drain_only === 'undefined')
      state.drain_only = false;
    return (input: MultiStepInput) => this.setRebalanceStrategy(input, state);
  }

  async setRebalanceStrategy(input: MultiStepInput, state: Partial<RebalanceTableShardsArgs>) {
    let active = rebalanceStrategyOptions.find(s => s.name === state.rebalance_strategy);
    state.rebalance_strategy = await input.showQuickPick({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      placeholder: 'Rebalance Strategy',
      ignoreFocusOut: true,
      items: rebalanceStrategyOptions,
      activeItem: active || undefined,
      convert: async (value: RebalanceStrategyQuickPickItem) => value.name
    });
    if (typeof state.rebalance_strategy === 'undefined')
      state.rebalance_strategy = 'by_shard_count';
  }
}

interface RebalanceTableShardsArgs {
  relation: string;
//  threshold: number;
//  max_shard_moves: integer;
//  excluded_shard_list: integer;
  shard_transfer_mode: string;
  drain_only: boolean;
  rebalance_strategy: string;
}