/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Thu Oct 19 2016 10:43:29 GMT-0500 (Central Daylight Time).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of MiniProject.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin MiniProject.
     * @constructor
     */
    var MiniProject = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    MiniProject.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    MiniProject.prototype = Object.create(PluginBase.prototype);
    MiniProject.prototype.constructor = MiniProject;

    /**s
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    MiniProject.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            nodeObject;


        // Using the logger.
        self.logger.debug('This is a debug message.');
        self.logger.info('This is an info message.');
        self.logger.warn('This is a warning message.');
        self.logger.error('This is an error message.');

        // Using the coreAPI to make changes.

        nodeObject = self.activeNode;

        // (1)
        // self.core.setAttribute(nodeObject, 'name', 'My new obj');
        // self.core.setRegistry(nodeObject, 'position', {x: 70, y: 70});


        // This will save the changes. If you don't want to save;
        // exclude self.save and call callback directly from this scope.
        // self.save('MiniProject updated model.')
        //     .then(function () {
        //         self.result.setSuccess(true);
        //         callback(null, self.result);
        //     })
        //     .catch(function (err) {
        //         // Result success is false at invocation.
        //         callback(err, self.result);
        //     });

        // (2)
        self.tree = [];
        self.meta = [];
        var artifact,
            level;
        self.loadNodeMap(self.rootNode)
            .then(function (nodes) {

                level = 1;
                self.printChildrenRec(self.rootNode, nodes, level);
                self.getmeta(self.rootNode, nodes); //
                var treeJson = JSON.stringify(self.tree, null, 4);
                var metaJson = JSON.stringify(self.meta, null, 4); //
                artifact = self.blobClient.createArtifact('project-data');
                // artifact.addFile('tree.json', treeJson);
                // artifact.addFile('meta.json', metaJson);
                return artifact.addFiles({
                    'tree.json': treeJson,
                    'meta.json': metaJson
                });
            })
            .then(function (fileHash) {
                self.result.addArtifact(fileHash);
                return artifact.save()
            })
            .then(function (artifactHash) {
                self.result.addArtifact(artifactHash);
                self.result.setSuccess(true);
                callback(null, self.result);
            })
            .catch(function (err) {
                // (3)
                self.logger.error(err.stack);
                // Result success is false at invocation.
                callback(err, self.result);
            });
    };

    MiniProject.prototype.loadNodeMap = function (node) {
        var self = this;
        return self.core.loadSubTree(node)
           .then(function (nodeArr) {
               var nodes = {},
                   i;
               for (i = 0; i < nodeArr.length; i += 1) {
                   nodes[self.core.getPath(nodeArr[i])] = nodeArr[i];
               }

               return nodes;
           });
    };


    MiniProject.prototype.printChildrenRec = function (root, nodes, level, indent) {
        var self = this,
            level,
            MetaNodeID,
            MetaNodeName,
            isMeta,
            metaType,
            children = {},
            childrenPaths,
            childNode,
            childObj,
            childKey,
            child = {};

        indent = indent || '';
        childrenPaths = self.core.getChildrenPaths(root);
        self.logger.info(indent, MetaNodeName, 'has', childrenPaths.length, 'children.');

        MetaNodeID = self.core.getRelid(root);
        isMeta = self.core.isMetaNode(root);
        MetaNodeName = self.core.getAttribute(root, 'name');

        for (var i = 0; i < childrenPaths.length; i += 1) {
            childNode = nodes[childrenPaths[i]];
            childObj = self.printChildrenRec(childNode, nodes, level + 1, indent + '  ');

            for (childKey in childObj) {
                children[childKey] = childObj[childKey];
            }
        }

        if (level == 1) {
            child = {name: MetaNodeName, children: children};
            self.tree.push(child);
        } else if (isMeta) {
            metaType = MetaNodeName;
            child[MetaNodeID] = {name: MetaNodeName, 
                isMeta: isMeta, 
                metaType: metaType, 
                children: children};
        } else {
            metaType = self.core.getAttribute(self.core.getBase(root), 'name');
            if (self.core.isConnection(root)) {
                var dstPath = self.core.getPointerPath(root, 'dst');
                var srcPath = self.core.getPointerPath(root, 'src'); 
                var dstName = self.core.getAttribute(nodes[dstPath], 'name');
                var srcName = self.core.getAttribute(nodes[srcPath], 'name');
                child[MetaNodeID] = {name: MetaNodeName, 
                    isMeta: isMeta, 
                    metaType: metaType, 
                    src: srcName, 
                    dst: dstName};
            } else {
                    child[MetaNodeID] = {name: MetaNodeName, 
                        isMeta: isMeta, 
                        metaType: metaType, 
                        children: children};
            }
        }
        return child;
    };

    MiniProject.prototype.getmeta = function (root, nodes) {
        var self = this,
            childrenPaths,
            childNode,
            MetaNodeName,
            pathOfMetaNode,
            isMeta,
            baseNode,
            baseName,
            child;

        isMeta = self.core.isMetaNode(root);
        MetaNodeName = self.core.getAttribute(root, 'name');
        pathOfMetaNode = self.core.getPath(root);
        childrenPaths = self.core.getChildrenPaths(root);

        for (var i = 0; i < childrenPaths.length; i += 1) {
            childNode = nodes[childrenPaths[i]];
            self.getmeta(childNode, nodes);
        }

        if (isMeta) {
            baseNode = self.core.getPointerPath(root, 'base');
            if (baseNode) {
                baseName = self.core.getAttribute(nodes[baseNode], 'name');
            } else {
                baseName = "null";
            }
            child = {name: MetaNodeName, 
                path: pathOfMetaNode, 
                nbrOfChildren: childrenPaths.length, 
                base: baseName};
            self.meta.push(child);
        }
        return child;
    };

    return MiniProject;
});