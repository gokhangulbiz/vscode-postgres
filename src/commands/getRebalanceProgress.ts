import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { IConnection } from "../common/IConnection";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";

export class getRebalanceProgressCommand extends BaseCommand {

  async run(treeNode: any) {
    let columnsToSelect: string[] = ['*'];

    const sql = `SELECT ${columnsToSelect.join(', ')} FROM pg_catalog.get_rebalance_progress();`

    return Database.runQuery(sql, vscode.window.activeTextEditor, treeNode.connection, true);
  }
}