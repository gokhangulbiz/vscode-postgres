import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { Global } from '../common/global';
import { SqlQueryManager } from '../queries';
import { QueryResult } from "pg";

export class distributeTableCommand extends BaseCommand {

  async run(treeNode: TableNode, count: number = 0, withNames: boolean = false, runOnly: boolean = false) {
    let connection = await Database.createConnection(treeNode.connection);

    let columnsToSelect: string[] = ['*'];
    const configSort = Global.Configuration.get<string>("tableColumnSortOrder");
    const sortOptions = {
      "db-order": 'a.attnum',
      "alpha": 'a.attname',
      "reverse-alpha": 'a.attname DESC'
    };
    if (!sortOptions[configSort]) sortOptions[configSort] = 'a.attnum';

    let tableSchema = treeNode.schema ?? 'public';
    let query = SqlQueryManager.getVersionQueries(connection.pg_version);

    try {
      let res: QueryResult = null;

      res = await connection.query(query.format(query.TableColumns, sortOptions[configSort]), [
        treeNode.getQuotedTableName(),
        treeNode.connection.database,
        tableSchema,
        treeNode.table
      ]);

      columnsToSelect = res.rows.map<string>(column => column.column_name);
    }
    catch (err) {
      return err;
    }
    finally {
       await connection.end();
    }
    
    const distributionColumn: string = await vscode.window.showQuickPick(columnsToSelect, { placeHolder: 'Distribution column?' }); 
    const colocate_with: string = await vscode.window.showInputBox({ prompt: "Colocate with?", placeHolder: "Colocate with (optional)" });
    const shard_count: string = await vscode.window.showInputBox({ prompt: "Shard count?", placeHolder: "Shard count (optional)" });
    
    try {
      connection = await Database.createConnection(treeNode.connection);

      let res: QueryResult = null;

      res = await connection.query("select create_distributed_table('" + treeNode.getQuotedTableName()+ "','"+ distributionColumn+"')");
      vscode.window.showInformationMessage(res.rowCount.toString());
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