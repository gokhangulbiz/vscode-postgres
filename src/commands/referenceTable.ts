import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { Global } from '../common/global';
import { SqlQueryManager } from '../queries';
import { QueryResult } from "pg";

export class referenceTableCommand extends BaseCommand {

  async run(treeNode: TableNode, count: number = 0, withNames: boolean = false, runOnly: boolean = false) {
    let connection = await Database.createConnection(treeNode.connection);

    try {
      connection = await Database.createConnection(treeNode.connection);

      let res: QueryResult = null;

      res = await connection.query("select create_reference_table('" + treeNode.getQuotedTableName()+ "')");
      vscode.window.showInformationMessage(treeNode.getQuotedTableName()+ " is now reference table.");
      return res;
    }
    catch (err) {
      vscode.window.showErrorMessage(err.message);
      return err;
    }
    finally {
      await connection.end();
    }

  }

}