import cells from './v1/cells.js';
import dataChanged from '@/service/x6/graph/data-changed.js';
import graphFactory from '@/service/x6/graph/graph.js';
import events from '@/service/x6/graph/events.js';
import store from '@/store/index.js';
import tmActions from '@/store/actions/threatmodel.js';
import { passiveSupport } from 'passive-events-support/src/utils';
import { validateCellsForRender, autoFixCells } from '@/service/validation';

const appVersion = require('../../../package.json').version;

passiveSupport({
    events: ['touchstart', 'mousewheel']
});

const drawV1 = (diagram, graph) => {
    const { nodes, edges } = cells.map(diagram);
    const batchName = 'td-init';
    graph.startBatch(batchName);
    nodes.forEach((node) => graph.addNode(node));
    edges.forEach((edge) => graph.addEdge(edge));
    graph.stopBatch(batchName);
};

// update a version 1.x threat model (and diagrams) to version 2.x
const upgradeAndDraw = (diagram, graph) => {
    drawV1(diagram, graph);

    const updated = graph.toJSON();
    updated.version = appVersion;
    updated.title = diagram.title;
    updated.description = diagram.description;
    updated.thumbnail = diagram.thumbnail;
    updated.id = diagram.id;
    updated.diagramType = diagram.diagramType;
    graph.getCells().forEach((cell) => dataChanged.updateStyleAttrs(cell));
    store.get().dispatch(tmActions.diagramSaved, updated);
    store.get().dispatch(tmActions.stash);
    store.get().dispatch(tmActions.notModified);

};

const drawGraph = (diagram, graph) => {
    if (diagram.version && diagram.version.startsWith('2.')) {
        console.debug('open diagram version: ' + diagram.version);
        diagram.version = appVersion;

        // Validate cells before rendering to catch issues early
        if (diagram.cells && diagram.cells.length > 0) {
            const validationResult = validateCellsForRender(diagram.cells);

            if (!validationResult.valid) {
                console.warn('[Diagram] Cell validation failed, attempting auto-fix...');
                validationResult.errors.forEach(err => {
                    console.warn(`  - ${err.code}: ${err.message}`);
                });

                // Attempt to auto-fix cells
                const { cells: fixedCells, fixes } = autoFixCells(diagram.cells);
                if (fixes.length > 0) {
                    console.info('[Diagram] Applied fixes:', fixes);
                    diagram.cells = fixedCells;
                }
            } else {
                console.debug('[Diagram] Cell validation passed');
            }

            // Log warnings even if valid
            if (validationResult.warnings && validationResult.warnings.length > 0) {
                validationResult.warnings.forEach(warn => {
                    console.warn(`[Diagram] Warning: ${warn.message}`);
                });
            }
        }

        graph.fromJSON(diagram);
    } else {
        console.debug('upgrade version 1.x diagram');
        upgradeAndDraw(diagram, graph);
    }
    return graph;
};

const draw = (container, diagram) => drawGraph(diagram, graphFactory.getReadonlyGraph(container));
const edit = (container, diagram) => drawGraph(diagram, graphFactory.getEditGraph(container));

const dispose = (graph) => {
    events.removeListeners(graph);
    graph.dispose();
};

export default {
    dispose,
    draw,
    edit
};
