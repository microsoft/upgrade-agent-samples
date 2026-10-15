// Copyright (c) Microsoft Corporation. All rights reserved.

const vscode = require('vscode');

exports.activate = function (context) {
    context.subscriptions.push(vscode.lm.registerMcpServerDefinitionProvider(
        'fabrikam.upgrade',
        {
            provideMcpServerDefinitions() {
                return [
                    new vscode.McpStdioServerDefinition(
                        'FabrikamUpgrade',
                        'dnx',
                        ['Fabrikam.Upgrade.Mcp', '--yes', '--ignore-failed-sources'],
                        {
                            PLUGIN_MODE: '1',
                            INSTALL_SOURCE: 'upgrade-plugin'
                        },
                        context.extension.packageJSON.version
                    )
                ];
            }
        }
    ));
};
