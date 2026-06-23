// Copyright (c) Microsoft Corporation. All rights reserved.

// This extender is a pure data contribution. The only thing it provides is the
// contributes.upgradeExtensions entry in package.json, which the Upgrade host
// extension reads by enumerating vscode.extensions.all. No activation logic is
// needed, so activate()/deactivate() are intentional no-ops.

exports.activate = function () { /* no-op */ };
exports.deactivate = function () { /* no-op */ };
