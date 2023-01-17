import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { Global } from '../common/global';
import { SqlQueryManager } from '../queries';
import { QueryResult } from "pg";
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";

export class undistributeTableCommand extends BaseCommand {

  async run(treeNode: TableNode, count: number = 0, withNames: boolean = false, runOnly: boolean = false) {
    let connection = await Database.createConnection(treeNode.connection);

    try {

      let res: QueryResult = null;

      res = await connection.query("select undistribute_table('" + treeNode.getQuotedTableName()+ "');");
      vscode.window.showInformationMessage(treeNode.getQuotedTableName()+ " is now undistributed.");
      return res;
    }
    catch (err) {
      vscode.window.showErrorMessage(err.message);
      return err;
    }
    finally {
      await connection.end();
      PostgreSQLTreeDataProvider.getInstance().refresh();
    }

  }

}