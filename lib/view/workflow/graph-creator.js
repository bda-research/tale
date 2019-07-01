//frontend dev by Shuopeng Li
document.onload = (function (d3, saveAs, Blob, undefined) {
    "use strict";
    var fs = require('fs');
    var path = require('path');
    var rmrf = require('rimraf');
    var R = require('ramda');
    var electron = require('electron');
    var { dialog } = electron.remote;
    // TODO add user settings
    var consts = {
        defaultTitle: "shift+click to edit info"
    };
    var settings = {
        appendElSpec: "#graph"
    };

    //Jobs related variable
    var jobsList = [];
    var jobId = 0;
    var selectedJob = {};
    var editJobOrNot = false;

    /*
    read current working directory job folder
    */

    let dirApp = process.cwd();
    const parentDir = path.join(dirApp + '/job');
    let allFile = fs.readdirSync(parentDir);
    allFile.forEach(file => {
        if (fs.statSync(path.join(parentDir, file)).isDirectory) {
            let data = null;
            let newJob = new Job([], [], 0, 0, file);
            addJob(jobsList, newJob);
        }
    });
    //show init list
    jobsList.forEach(list => console.log(list))
    generateJobSwitcher(jobsList);


    let jobAdderTemplate = {
        name: 'Job Info', content: [{
            name: 'Job Name', inputId: 'jobName', type: 'text', optionsInfo: {
            }, defaultValue: 'Job Name'
        }]
    };

    //TODELETE test dynamic template 
    // this is the structure of node function template
    let testTemplate1 = {
        funcId: 1, funcName: 'CSV', content: [{
            name: 'Test Prop1', inputId: 'testProp1', type: 'select', optionsInfo: [
                'default select', 'selection1', 'selection2'
            ], defaultValue: 'default select'
        }, {
            name: 'Test Prop2', inputId: 'testProp2', type: 'text', optionsInfo: [], defaultValue: 'defaultValue1'
        }]
    };

    let testTemplate2 = {
        funcId: 2, funcName: 'TestFunc 2', content: [{
            name: 'Test Input1', inputId: 'testInput1', type: '2', optionsInfo: [
            ], defaultValue: 'default value2'
        }, {
            name: 'Test Input2', inputId: 'testInput2', type: 'text', optionsInfo: [], defaultValue: 'daultValue2'
        }]
    };

    //TODO: generate a key value map for different templates from what ever sources
    let templateMap = new Map();
    let currentTemplate;
    templateMap.set(testTemplate1.funcId, testTemplate1);
    templateMap.set(testTemplate2.funcId, testTemplate2);
    generateFunctionsSelect();

    function generateFunctionsSelect() {
        if (templateMap) {
            let optionsString = '';
            // templateMap.forEach((templateItem, key) => {
            //     optionsString = optionsString + `<option value="${templateItem.funcId}">${templateItem.funcName}</option>`;
            // });
            generateModalDynamically2(templateMap.values().next().value);
            // $('#txt_func').html(optionsString);
            // $('#txt_func').on('change', function (e) {
            //     // generateModalDynamically2(templateMap.get(parseInt(e.target.value)));
            //     // retrieveProptiesAndAssign();
            // });
        }
    }

    // define graphcreator object
    var GraphCreator = function (svg, nodes, edges) {
        var thisGraph = this;
        thisGraph.idct = 0;
        thisGraph.egid = 0;
        /**
         * this: GraphCreator object
         * 
         */
        //console.log(this);
        thisGraph.nodes = nodes || [];
        thisGraph.edges = edges || [];

        //first Job init region
        let addJobTemplate = new ModalTemplate(jobAdderTemplate.name, jobAdderTemplate.content);
        generateModalDynamically(addJobTemplate);
        //dont show modal at the beginning
        // $('#dynamicModal').modal();
        // $('input[name="Job Name"]').focus();
        // $('#dynamic_submit').unbind('click').click(function () {
        //   let jobName = $('input[name="Job Name"]').val();
        //   thisGraph.deleteGraph(true);
        //   let newJob = new Job([], [], 0, 0, jobName);
        //   addJob(jobsList, newJob);
        //   selectJobAndUpdateView(thisGraph, jobsList, newJob.id);
        // });
        // //add enter key event
        // $("#dynamic_submit").keypress(function (e) {
        //   if (e.which == 13) {
        //     $("#dynamic_submit").click();
        //   }
        // })
        // region ends

        thisGraph.state = {
            selectedNode: null,
            selectedEdge: null,
            mouseDownNode: null,
            mouseDownLink: null,
            justDragged: false,
            justScaleTransGraph: false,
            lastKeyDown: -1,
            shiftNodeDrag: false,
            selectedText: null
        };

        // define arrow markers for graph links
        var defs = svg.append('svg:defs');
        defs.append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', "32")
            .attr('markerWidth', 3.5)
            .attr('markerHeight', 3.5)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        // define arrow markers for leading arrow
        defs.append('svg:marker')
            .attr('id', 'mark-end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 7)
            .attr('markerWidth', 3.5)
            .attr('markerHeight', 3.5)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        thisGraph.svg = svg;
        thisGraph.svgG = svg.append("g")
            .classed(thisGraph.consts.graphClass, true);
        var svgG = thisGraph.svgG;

        // displayed when dragging between nodes
        thisGraph.dragLine = svgG.append('svg:path')
            .attr('class', 'link dragline hidden')
            .attr('d', 'M0,0L0,0')
            .style('marker-end', 'url(#mark-end-arrow)');

        // svg nodes and edges
        thisGraph.paths = svgG.append("g").selectAll("g");
        thisGraph.circles = svgG.append("g").selectAll("g");

        thisGraph.drag = d3.behavior.drag()
            .origin(function (d) {
                return { x: d.x, y: d.y };
            })
            .on("drag", function (args) {
                thisGraph.state.justDragged = true;
                thisGraph.dragmove.call(thisGraph, args);
            })
            .on("dragend", function () {
                // todo check if edge-mode is selected
            });

        // listen for key events
        d3.select(window).on("keydown", function () {
            thisGraph.svgKeyDown.call(thisGraph);
        })
            .on("keyup", function () {
                thisGraph.svgKeyUp.call(thisGraph);
            });
        svg.on("mousedown", function (d) { thisGraph.svgMouseDown.call(thisGraph, d); });
        svg.on("mouseup", function (d) { thisGraph.svgMouseUp.call(thisGraph, d); });

        // listen for dragging
        var dragSvg = d3.behavior.zoom()
            .on("zoom", function () {
                if (d3.event.sourceEvent.shiftKey) {
                    // TODO  the internal d3 state is still changing
                    return false;
                } else {
                    thisGraph.zoomed.call(thisGraph);
                }
                return true;
            })
            .on("zoomstart", function () {
                var ael = d3.select("#" + thisGraph.consts.activeEditId).node();
                if (ael) {
                    ael.blur();
                }
                if (!d3.event.sourceEvent.shiftKey) d3.select('body').style("cursor", "move");
            })
            .on("zoomend", function () {
                d3.select('body').style("cursor", "auto");
            });

        svg.call(dragSvg).on("dblclick.zoom", null);

        // listen for resize
        window.onresize = function () { thisGraph.updateWindow(svg); };

        // handle download data
        //directlt save the data instead of pop a window
        d3.select("#download-input").on("click", function () {
            var saveEdges = thisGraph.edges;
            var saveNodes = thisGraph.nodes;
            //save nodes
            let nodesObj = '\'use strict\'\n\nmodule.exports = [\n';
            saveNodes.forEach(n => {
                nodesObj += `\t{id: \'${n.id}\', title: \'${n.title}\', func: \'${n.func}\'},\n`;
            })
            nodesObj += '];';
            fs.writeFile(path.join(parentDir, selectedJob.name, 'step/index.js'), nodesObj, (err) => {
                if(err) alert(err.stack);
                else alert('node saved successfully');
            });

           
            let edgeObj = '\'use strict\'\n\nmodule.exports = [\n';
            saveEdges.forEach(n => {
                edgeObj += `\t{source: \'${n.source.title}\', target: \'${n.target.title}\', func: \'${n.func}\'},\n`;
            })
            edgeObj += '];';
            fs.writeFile(path.join(parentDir, selectedJob.name, 'register.js'), edgeObj, (err) => {
                if(err) alert(err.stack);
                else alert('edges saved successfully');
            });

            // let filepath = path.join(parentDir, selectedJob.name, 'step/index.js');
            // fs.writeFile(filepath, JSON.stringify({ "job": { name: selectedJob.name ? selectedJob.name : 'undefined job' }, "nodes": saveNodes, "edges": saveEdges }), (err) => {
            //     if(err) alert(err);
            //     else alert('data saved successfully');
            // });
            // var blob = new Blob([window.JSON.stringify({ "job": { name: selectedJob.name ? selectedJob.name : 'undefined job' }, "nodes": saveNodes, "edges": saveEdges })], { type: "text/plain;charset=utf-8" });
            // saveAs(blob, "mydag.json");
        });

        //Jquery event hanlder*****************************************************
        //*************************************************************************

        //the job select and job delete work is actually here
        $('#jobContainer').on('click', function (event) {
            console.log(event.target.value)
            let operationItem = event.target.value.split(" ");
            if (operationItem.length === 1) {
                if (editJobOrNot) {
                    //when in edit mode click job item will trigger job Editor
                    $('#dynamicModal').modal();
                    $('input[name="Job Name"]').val(event.target.innerHTML);
                    $('input[name="Job Name"]').focus();
                    $('#dynamic_submit').unbind('click').click(function () {
                        let jobName = $('input[name="Job Name"]').val();
                        let operatedJob = getJobById(jobsList, parseInt(event.target.value));
                        fs.renameSync(path.join(parentDir + '/' + operatedJob.name), path.join(parentDir + '/' + jobName));
                        operatedJob.name = jobName;

                        event.target.innerHTML = operatedJob.name;
                    });
                    //add enter key event
                    $("#dynamic_submit").keypress(function (e) {
                        if (e.which == 13) {
                            $("#dynamic_submit").click();
                        }
                    })
                } else {
                    //readJson(thisGraph, jobsList, parseInt(event.target.value))
                    let jobName = jobsList[event.target.value];
                    selectJobAndUpdateView(thisGraph, jobsList, parseInt(event.target.value));
                }
            } else {
                inAndOutEditMode();
                let deletedJobId = parseInt(operationItem[1]);
                let nextJobId = deleteJob(jobsList, deletedJobId);
                if (nextJobId >= 0) {
                    generateJobSwitcher(jobsList);
                    selectJobAndUpdateView(thisGraph, jobsList, nextJobId);
                } else {
                    thisGraph.deleteGraph(true);
                    generateJobSwitcher(jobsList);
                    //reset select job
                    selectedJob = {};
                    $('#jobAdder').click();
                }
            }

        });

        $('#jobAdder').on('click', () => {

            let addJobTemplate = new ModalTemplate(jobAdderTemplate.name, jobAdderTemplate.content);
            generateModalDynamically(addJobTemplate);

            $('#dynamicModal').modal();
            // $('#edge_func').val(d.func);
            // $('#edge_func').focus();
            $('#dynamic_submit').unbind('click').click(function () {
                let jobName = $('input[name="Job Name"]').val();
                thisGraph.deleteGraph(true);
                let newJob = new Job([], [], 0, 0, jobName);
                let _lib = path.join(parentDir, jobName, 'lib');
                let _test = path.join(parentDir, jobName, 'test');
                let _step = path.join(parentDir, jobName, 'step');
                if (!fs.existsSync(path.join(parentDir, jobName))) {
                    [_lib, _test, _step].map(path => fs.mkdirSync(path, { recursive: true }));
                    let saveNodes = [], saveEdges = [];
                    fs.writeFileSync(path.join(parentDir, jobName, 'mydag.json'), JSON.stringify({ "job": { name: jobName}, "nodes": saveNodes, "edges": saveEdges }))
                    addJob(jobsList, newJob);
                    selectJobAndUpdateView(thisGraph, jobsList, newJob.id);
                } else {
                    alert('Directory already exists!');
                }

            });
            //add enter key event
            $("#dynamic_submit").keypress(function (e) {
                if (e.which == 13) {
                    $("#dynamic_submit").click();
                }
            })

        });

        $('#jobDelete').on('click', () => {
            inAndOutEditMode();
        });

        $('#graphFormat').on('click', () => {
            formatNodes(thisGraph, 300, 200);
            thisGraph.updateGraph();
        });
        // handle uploaded data
        d3.select("#upload-input").on("click", function () {
            document.getElementById("hidden-file-upload").click();
        });
        d3.select("#hidden-file-upload").on("change", function () {
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                var uploadFile = this.files[0];
                var filereader = new window.FileReader();

                filereader.onload = function () {
                    var txtRes = filereader.result;
                    // TODO better error handling
                    try {
                        var jsonObj = JSON.parse(txtRes);
                        //init thisGraph.egid to 0
                        thisGraph.egid = 0;
                        thisGraph.deleteGraph(true);
                        thisGraph.nodes = jsonObj.nodes;

                        //TODO move the attachInfo function into format just outside for now

                        // validateGraphFormat(thisGraph);
                        thisGraph.setIdCt(jsonObj.nodes.length + 1);
                        var newEdges = jsonObj.edges;
                        newEdges.forEach(function (e, i) {
                            newEdges[i] = {
                                id: i,
                                source: thisGraph.nodes.filter(function (n) { return n.id == e.source.id; })[0],
                                target: thisGraph.nodes.filter(function (n) { return n.id == e.target.id; })[0],
                                func: e.func
                            };
                            thisGraph.egid++;
                        });
                        thisGraph.edges = newEdges;

                        formatNodes(thisGraph, 300, 200);

                        let jobName = jsonObj.job ? jsonObj.job.name : undefined;
                        let newJob = new Job(thisGraph.nodes, thisGraph.edges, thisGraph.egid, thisGraph.idct, jobName);
                        addJob(jobsList, newJob)
                        selectJobAndUpdateView(thisGraph, jobsList, newJob.id);
                    } catch (err) {
                        window.alert("Error parsing uploaded file\nerror message: " + err.message);
                        return;
                    }
                };
                filereader.readAsText(uploadFile);

            } else {
                alert("Your browser won't let you save this graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
            }

        });

        //Jquery handler region ends

        // handle delete graph
        d3.select("#delete-graph").on("click", function () {
            thisGraph.deleteGraph(false);
        });
    };

    GraphCreator.prototype.setIdCt = function (idct) {
        this.idct = idct;
    };

    GraphCreator.prototype.consts = {
        selectedClass: "selected",
        connectClass: "connect-node",
        circleGClass: "conceptG",
        graphClass: "graph",
        activeEditId: "active-editing",
        BACKSPACE_KEY: 8,
        DELETE_KEY: 46,
        ENTER_KEY: 13,
        nodeRadius: 50
    };

    /* PROTOTYPE FUNCTIONS */

    GraphCreator.prototype.dragmove = function (d) {
        var thisGraph = this;
        if (thisGraph.state.shiftNodeDrag) {
            thisGraph.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(thisGraph.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
        } else {
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            thisGraph.updateGraph();
        }
    };

    GraphCreator.prototype.deleteGraph = function (skipPrompt) {
        d3.selectAll('text').remove();
        var thisGraph = this,
            doDelete = true;
        if (!skipPrompt) {
            doDelete = window.confirm("Press OK to delete this graph");
        }
        if (doDelete) {
            thisGraph.nodes = [];
            thisGraph.edges = [];
            thisGraph.egid = 0;
            thisGraph.updateGraph();
        }
    };

    /* select all text in element: taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element */
    GraphCreator.prototype.selectElementContents = function (el) {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        //sel.addRange(range);
    };


    /* insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
    GraphCreator.prototype.insertTitleLinebreaks = function (gEl, title) {
        var words = title.split(/\s+/g),
            nwords = words.length;
        var el = gEl.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-" + (nwords - 1) * 7.5);

        for (var i = 0; i < words.length; i++) {
            var tspan = el.append('tspan').text(words[i]);
            if (i > 0)
                tspan.attr('x', 0).attr('dy', '15');
        }
    };


    // remove edges associated with a node
    GraphCreator.prototype.spliceLinksForNode = function (node) {
        var thisGraph = this,
            toSplice = thisGraph.edges.filter(function (l) {
                return (l.source === node || l.target === node);
            });
        toSplice.map(function (l) {
            thisGraph.edges.splice(thisGraph.edges.indexOf(l), 1);
        });
    };

    GraphCreator.prototype.replaceSelectEdge = function (d3Path, edgeData) {
        var thisGraph = this;
        d3Path.classed(thisGraph.consts.selectedClass, true);
        if (thisGraph.state.selectedEdge) {
            thisGraph.removeSelectFromEdge();
        }
        thisGraph.state.selectedEdge = edgeData;
    };

    GraphCreator.prototype.replaceSelectNode = function (d3Node, nodeData) {
        var thisGraph = this;
        d3Node.classed(this.consts.selectedClass, true);
        if (thisGraph.state.selectedNode) {
            thisGraph.removeSelectFromNode();
        }
        thisGraph.state.selectedNode = nodeData;
    };

    GraphCreator.prototype.removeSelectFromNode = function () {
        var thisGraph = this;
        thisGraph.circles.filter(function (cd) {
            return cd.id === thisGraph.state.selectedNode.id;
        }).classed(thisGraph.consts.selectedClass, false);
        thisGraph.state.selectedNode = null;
    };

    GraphCreator.prototype.removeSelectFromEdge = function () {
        var thisGraph = this;
        thisGraph.paths.filter(function (cd) {
            return cd === thisGraph.state.selectedEdge;
        }).classed(thisGraph.consts.selectedClass, false);
        thisGraph.state.selectedEdge = null;
    };

    GraphCreator.prototype.pathMouseDown = function (d3path, d) {
        var thisGraph = this,
            state = thisGraph.state;
        d3.event.stopPropagation();
        state.mouseDownLink = d;

        if (state.selectedNode) {
            thisGraph.removeSelectFromNode();
        }

        console.log(thisGraph.edges);
        if (d3.event.shiftKey) {
            $("#edgeModal").modal();
            /**
             * handle save method
            */
            $('#edge_func').val(d.func);
            $('#edge_func').focus();
            $('#edge_submit').unbind('click').click(function () {
                let func = $('input[name="edge_func"]').val();
                d.func = func;
                $(`textPath#${d.id}`).text(func);
                thisGraph.updateGraph();
            });
            //add enter key event
            $("#edge_func").keypress(function (e) {
                if (e.which == 13) {
                    $("#edge_submit").click();
                }
            })
        }
        var prevEdge = state.selectedEdge;
        if (!prevEdge || prevEdge !== d) {
            thisGraph.replaceSelectEdge(d3path, d);
        } else {
            thisGraph.removeSelectFromEdge();
        }
    };

    // mousedown on node
    GraphCreator.prototype.circleMouseDown = function (d3node, d) {
        var thisGraph = this,
            state = thisGraph.state;
        d3.event.stopPropagation();
        state.mouseDownNode = d;
        if (d3.event.shiftKey) {
            state.shiftNodeDrag = d3.event.shiftKey;
            // reposition dragged directed edge   
            thisGraph.dragLine.classed('hidden', false)
                .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
            return;
        }
    };

    /* place editable text on node in place of svg text */
    GraphCreator.prototype.changeTextOfNode = function (d3node, d) {
        //console.log('changeID: ', d.id);
        var thisGraph = this,
            consts = thisGraph.consts,
            htmlEl = d3node.node();
        d3node.selectAll("text").remove();
        var nodeBCR = htmlEl.getBoundingClientRect(),
            curScale = nodeBCR.width / consts.nodeRadius,
            placePad = 5 * curScale,
            useHW = curScale > 1 ? nodeBCR.width * 0.71 : consts.nodeRadius * 1.42;
        // replace with editableconent text
        // var d3txt = thisGraph.svg.selectAll("foreignObject")
        //   .data([d])
        //   .enter()
        //   .append("foreignObject")
        //   .attr("x", nodeBCR.left + placePad)
        //   .attr("y", nodeBCR.top + placePad)
        //   .attr("height", 2 * useHW)
        //   .attr("width", useHW)
        //   .append("xhtml:p")
        //   .attr("id", consts.activeEditId)
        //   .attr("contentEditable", "true")
        //   .text(d.title)
        //   .on("mousedown", function (d) {
        //     d3.event.stopPropagation();
        //   })
        //   .on("keydown", function (d) {
        //     d3.event.stopPropagation();
        //     if (d3.event.keyCode == consts.ENTER_KEY && !d3.event.shiftKey) {
        //       this.blur();
        //     }
        //   })
        // .on("blur", function (d) {
        //   d.title = this.textContent;
        //   // thisGraph.insertTitleLinebreaks(d3node, d.title);
        //   d3.select(this.parentElement).remove();
        // });

        //return d3txt;
    };
    const fuckingoff = function (d, d3node, thisGraph) {
        // d.title = d3txt.textContent;
        //console.log(d3node);
        thisGraph.insertTitleLinebreaks(d3node, d.title);
        d3.select(d3node.parentElement).remove();
    }
    // mouseup on nodes
    GraphCreator.prototype.circleMouseUp = function (d3node, d) {
        var thisGraph = this,
            state = thisGraph.state,
            consts = thisGraph.consts;
        // reset the states
        state.shiftNodeDrag = false;
        state.justDragged = false;
        d3node.classed(consts.connectClass, false);

        var mouseDownNode = state.mouseDownNode;

        if (!mouseDownNode) return;

        thisGraph.dragLine.classed("hidden", true);

        if (mouseDownNode !== d) {
            // we're in a different node: create new edge for mousedown edge and add to graph
            var newEdge = { id: thisGraph.egid++, source: mouseDownNode, target: d, func: 'default' };
            if (d3.event.shiftKey) {
                //reset edgeModel input
                $('#edge_func').val(d.func && d.func !== '' ? templateMap.get(parseInt(d.func)).funcName : 'default');
                //reset area ends
                $("#edgeModal").modal();
                /**
                 * handle save method
                */
                $('#edge_func').focus();
                $('#edge_submit').unbind('click').click(function () {
                    let func = $('input[name="edge_func"]').val();
                    newEdge.func = func;
                    $(`textPath#${newEdge.id}`).text(func);
                    console.log($(`textPath#${newEdge.id}`).html())
                });
                //add enter key event
                $("#edge_func").keypress(function (e) {
                    if (e.which == 13) {
                        $("#edge_submit").click();
                    }
                })
            }
            var filtRes = thisGraph.paths.filter(function (d) {
                if (d.source === newEdge.target && d.target === newEdge.source) {
                    thisGraph.edges.splice(thisGraph.edges.indexOf(d), 1);
                }
                return d.source === newEdge.source && d.target === newEdge.target;
            });
            if (!filtRes[0].length) {
                thisGraph.edges.push(newEdge);
                //console.log(thisGraph.edges)
                thisGraph.updateGraph();
            }
        } else {
            // we're in the same node
            if (state.justDragged) {
                // dragged, not clicked
                state.justDragged = false;
            } else {
                // clicked on a node, not dragged
                if (d3.event.shiftKey) {
                    // shift-clicked node: edit text content
                    ///console.log('shift clicked on this node')

                    nodeFormInit(d);
                    $('#btn_submit').unbind('click').click(function () {
                        let title = $('input[name="txt_node_id"]').val();
                        let func = $('input[name="txt_func"]').val();
                        let describe = $('input[name="txt_statu"]').val();
                        d.title = title;
                        d.func = func;
                        d.describe = describe;
                        extractPropertiesAndAssign(d);
                        d3node.selectAll("text").remove();
                        fuckingoff(d, d3node, thisGraph)
                    });
                    //add enter key event
                    $("#myModal").keypress(function (e) {
                        if (e.which == 13) {
                            $("#btn_submit").click();
                        }
                    })

                } else {
                    if (state.selectedEdge) {
                        if (d3.event.shiftKey) {
                            console.log('yes')
                        } else {
                            thisGraph.removeSelectFromEdge();
                        }
                    }
                    var prevNode = state.selectedNode;

                    if (!prevNode || prevNode.id !== d.id) {
                        thisGraph.replaceSelectNode(d3node, d);
                    } else {
                        thisGraph.removeSelectFromNode();
                    }
                }
            }
        }
        state.mouseDownNode = null;
        return;

    }; // end of circles mouseup

    // mousedown on main svg
    GraphCreator.prototype.svgMouseDown = function () {
        this.state.graphMouseDown = true;
    };

    // mouseup on main svg
    GraphCreator.prototype.svgMouseUp = function () {
        var thisGraph = this,
            state = thisGraph.state;
        if (state.justScaleTransGraph) {
            // dragged not clicked
            state.justScaleTransGraph = false;
        } else if (state.graphMouseDown && d3.event.shiftKey) {
            //get xy coordinations 
            let xycoords = d3.mouse(thisGraph.svgG.node());
            nodeFormInit();
            $('#btn_submit').unbind('click').click(function () {
                //console.log('inner id' + d.id);
                let title = $('input[name="txt_node_id"]').val();
                let func = $('select[name="txt_func"]').val();
                let describe = $('input[name="txt_statu"]').val();
                var d = { id: thisGraph.idct++, title: title ? title : consts.defaultTitle, func: func, describe: describe, x: xycoords[0], y: xycoords[1] };
                extractPropertiesAndAssign(d);
                thisGraph.nodes.push(d);
                thisGraph.updateGraph();
            });
            //add enter key event
            $("#myModal").keypress(function (e) {
                if (e.which == 13) {
                    $("#btn_submit").click();
                }
            })
        } else if (state.shiftNodeDrag) {
            // dragged from node 
            state.shiftNodeDrag = false;
            thisGraph.dragLine.classed("hidden", true);
        }
        state.graphMouseDown = false;
    };

    // keydown on main svg
    GraphCreator.prototype.svgKeyDown = function () {
        var thisGraph = this,
            state = thisGraph.state,
            consts = thisGraph.consts;
        // make sure repeated key presses don't register for each keydown
        if (state.lastKeyDown !== -1) return;

        state.lastKeyDown = d3.event.keyCode;
        var selectedNode = state.selectedNode,
            selectedEdge = state.selectedEdge;

        switch (d3.event.keyCode) {
            //case consts.BACKSPACE_KEY:
            case consts.DELETE_KEY:
                d3.event.preventDefault();
                if (selectedNode) {
                    thisGraph.nodes.splice(thisGraph.nodes.indexOf(selectedNode), 1);
                    thisGraph.spliceLinksForNode(selectedNode);
                    state.selectedNode = null;
                    thisGraph.updateGraph();
                } else if (selectedEdge) {
                    thisGraph.edges.splice(thisGraph.edges.indexOf(selectedEdge), 1);
                    state.selectedEdge = null;
                    thisGraph.updateGraph();
                }
                break;
        }
    };

    GraphCreator.prototype.svgKeyUp = function () {
        this.state.lastKeyDown = -1;
    };

    // call to propagate changes to graph
    GraphCreator.prototype.updateGraph = function () {
        var thisGraph = this,
            consts = thisGraph.consts,
            state = thisGraph.state;

        thisGraph.paths = thisGraph.paths.data(thisGraph.edges, function (d) {
            return String(d.source.id) + "+" + String(d.target.id);
        });
        var paths = thisGraph.paths;
        // update existing paths
        paths.style('marker-end', 'url(#end-arrow)')
            .classed(consts.selectedClass, function (d) {
                return d === state.selectedEdge;
            })
            .attr("d", function (d) {
                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
            });

        // add new paths
        const p = paths.enter().append("g");
        paths.enter()
            .append("path")
            .style('marker-end', 'url(#end-arrow)')
            .classed("link", true)
            .attr('id', d => {
                // console.log(d.id);
                return "path" + d.id;
            })
            .attr("d", function (d) {
                return "M" + d.source.x + "," + d.source.y + "L" + d.target.x + "," + d.target.y;
            })
            .on("mousedown", function (d) {
                thisGraph.pathMouseDown.call(thisGraph, d3.select(this), d);
            }
            )
            .on("mouseup", function (d) {
                state.mouseDownLink = null;
            }).on("mouseover", function (d) {
                getInfoAndDisplay(d);
                $('.info-display-panel').css('display', 'block');
            }).on("mouseout", function (d) {
                $('.info-display-panel').css('display', 'none');
            });

        p.append("text").attr("dy", -20)
            .append("textPath")
            .attr('id', d => {
                return '' + d.id;
            })

            .attr("text-anchor", "start")
            .style("font-size", 25)
            .style("fill", "#000")
            .style("text-anchor", "middle")
            .attr("startOffset", "50%")
            .attr("xlink:href", function (d) {
                //console.log(d.id);
                return "#path" + d.id;
            })
            .text(function (d) {

                return d.func;
            });

        // remove old links
        paths.exit().remove();

        // update existing nodes
        thisGraph.circles = thisGraph.circles.data(thisGraph.nodes, function (d) { return d.id; });
        thisGraph.circles.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

        // add new nodes
        var newGs = thisGraph.circles.enter()
            .append("g");

        newGs.classed(consts.circleGClass, true)
            .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .on("mouseover", function (d) {
                if (state.shiftNodeDrag) {
                    d3.select(this).classed(consts.connectClass, true);
                }
                getInfoAndDisplay(d);
                $('.info-display-panel').css('display', 'block');
            })
            .on("mouseout", function (d) {
                d3.select(this).classed(consts.connectClass, false);
                $('#infoDisplayPanel').css('display', 'none');
                //TODO hide info display when mouse out the node circle
            })
            .on("mousedown", function (d) {
                thisGraph.circleMouseDown.call(thisGraph, d3.select(this), d);
            })
            .on("mouseup", function (d) {
                //console.log(d3.select(this));
                thisGraph.circleMouseUp.call(thisGraph, d3.select(this), d);
            })
            .call(thisGraph.drag);

        newGs.append("circle")
            .attr("r", String(consts.nodeRadius));

        newGs.each(function (d) {
            thisGraph.insertTitleLinebreaks(d3.select(this), d.title);
        });

        // remove old nodes
        thisGraph.circles.exit().remove();
    };

    GraphCreator.prototype.zoomed = function () {
        this.state.justScaleTransGraph = true;
        d3.select("." + this.consts.graphClass)
            .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
    };

    GraphCreator.prototype.updateWindow = function (svg) {
        var docEl = document.documentElement,
            bodyEl = document.getElementsByTagName('body')[0];
        var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
        var y = window.innerHeight || docEl.clientHeight || bodyEl.clientHeight;
        svg.attr("width", x).attr("height", y);
    };


    /**** MAIN ****/


    // warn the user when leaving
    window.onbeforeunload = function () {
        return "Make sure to save your graph locally before leaving :-)";
    };

    var docEl = document.documentElement,
        bodyEl = document.getElementsByTagName('body')[0];

    var width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
        height = window.innerHeight || docEl.clientHeight || bodyEl.clientHeight;

    var xLoc = width / 2 - 25,
        yLoc = 100;

    // initial node data
    var nodes = [];
    var edges = [];


    /** MAIN SVG **/
    /**
     * settings.appendElSpec = #graph
     */
    var svg = d3.select(settings.appendElSpec).append("svg")
        .attr("width", width)
        .attr("height", height);
    var graph = new GraphCreator(svg, nodes, edges);
    graph.setIdCt(0);
    graph.updateGraph();

    function formatNodes(thisGraph, xDistance, yDistance, direction) {
        attachParentsAndChildrenInfoToNode();
        //find nodes borders
        let leftBorder = findBorderCoordinate(thisGraph.nodes, true, false);
        let rightBorder = findBorderCoordinate(thisGraph.nodes, true, true);
        let startNode = findStartNode(thisGraph.nodes.slice(), true);
        //TODO just for test


        let blockCount = 0;
        console.log(leftBorder);
        console.log(rightBorder);

        while (rightBorder > (leftBorder + (blockCount - 1) * xDistance)) {
            let calculateNodes = thisGraph.nodes.filter(e => {
                return e.x > (startNode.x + ((blockCount - 0.5) * xDistance)) && e.x <= startNode.x + ((blockCount + 0.5) * xDistance);
            });

            calculateNodes.forEach(e => {
                //TODO leftBorder could be replaced by other parameter which is used to relocate the whole diagram
                e.x = leftBorder + blockCount * xDistance;
            });
            blockCount++;
            //TODO TOP,BOTTOM, MIDDLE alignment
            //For now only care about the top one and then offset
            calculateNodes.sort((a, b) => {
                return a.y - b.y;
            })
            if (calculateNodes.length >= 1) {
                let middleIndex = findMidlleNodeIndex(calculateNodes, startNode);

                calculateNodes.forEach((e, i) => {
                    if (i === middleIndex) {
                        e.y = startNode.y
                    } else {
                        e.y = startNode.y + (i - middleIndex) * yDistance;
                    }
                });
            }
        }

        function findMidlleNodeIndex(nodesList, startNode) {
            let yDifference = Infinity;
            let mostCloseIndex = -1;
            nodesList.forEach((e, i) => {
                if (Math.abs(e.y - startNode.y) < yDifference) {
                    yDifference = Math.abs(e.y - startNode.y);
                    mostCloseIndex = i;
                }
            })

            return mostCloseIndex;
        }

        function findBorderCoordinate(nodeArr, isXCoordinate, isMax) {
            let resultCoordinate;
            const coordinateArray = nodeArr.map(e => {
                return isXCoordinate ? e.x : e.y;
            })

            resultCoordinate = coordinateArray.reduce((a, b) => {
                return isMax ? (a > b ? a : b) : (a < b ? a : b);
            })

            return resultCoordinate;
        }

        function findStartNode(nodeArr, isXCoordinate) {
            let startNodeCandidates = nodeArr.filter(e => {
                return e.parents.length === 0;
            });
            let startNode = startNodeCandidates.reduce((a, b) => {
                return (a.x < b.x) || (a.x === b.x && a.id < b.id) ? a : b;
            });
            return startNode;
        }

        //this is work for format the layout of nodes
        function attachParentsAndChildrenInfoToNode() {
            // special case will list below
            // 1. one node has two or above children in a single horizontal vertical line 
            let calculateMap = new Map();
            thisGraph.nodes.forEach(e => {
                calculateMap.set(e.id, Object.assign(e, { parents: [], children: [] }))
            });

            thisGraph.edges.forEach(e => {
                console.log(e)
                console.log(e.target);
                calculateMap.get(parseInt(e.target.id)).parents.push(e.source.id);
                calculateMap.get(parseInt(e.source.id)).children.push(e.target.id)
            });

            console.log(calculateMap);
            console.log('******************************');
            console.log(thisGraph.nodes);
        }

    }



    //UI manipulate region
    function generateJobSwitcher(jobsList) {
        let jobSwitcherString = '';
        jobsList.forEach(job => {
            jobSwitcherString = jobSwitcherString + `<div class="job-item"><button class="job-btn" value="${job.id}">${job.name}</button><button class="delete-btn" value="delete ${job.id}">X</button></div>`
        });
        $('#jobContainer').html(jobSwitcherString);
    }



    function selectJobAndUpdateView(thisGraph, jobsList, jobId) {
        let nodeIndex;
        let currentJob;
        thisGraph.deleteGraph(true);
        $('.job-selected').removeClass('job-selected');
        if (jobsList) {
            jobsList.forEach((e, i) => {
                if (e.id === jobId) {
                    nodeIndex = i;
                }
            });
            $(`#jobContainer div:nth-child(${nodeIndex + 1})`).addClass('job-selected');
        }

        currentJob = jobsList[nodeIndex];
        selectedJob = currentJob;
        let jobName = currentJob.name;
        let data = null;
        //readJson(currentJob.name, thisGraph);
        try {
            // data = JSON.parse(fs.readFileSync(path.join(parentDir, jobName, 'mydag.json'), 'utf-8'));
            // thisGraph.egid = 0;
            // thisGraph.deleteGraph(true);
            // thisGraph.nodes = data.nodes;

            // //TODO move the attachInfo function into format just outside for now

            // // validateGraphFormat(thisGraph);
            // thisGraph.setIdCt(data.nodes.length + 1);
            // var newEdges = data.edges;
            // newEdges.forEach(function (e, i) {
            //     newEdges[i] = {
            //         id: i,
            //         source: thisGraph.nodes.filter(function (n) { return n.id == e.source.id; })[0],
            //         target: thisGraph.nodes.filter(function (n) { return n.id == e.target.id; })[0],
            //         func: e.func
            //     };
            //     thisGraph.egid++;
            // });
            // thisGraph.edges = newEdges;

            
            let nodeArr = require(path.join(parentDir, jobName, 'step/index.js'));
            thisGraph.deleteGraph(true);
            let initX = 400;
            let initY = 400;
            nodeArr.forEach(function(e, i) {
                nodeArr[i] = {
                    id: e.id,
                    title: e.title,
                    func: e.func,
                    x: 400,
                    y: 400
                };
            });
            thisGraph.nodes = nodeArr;
            
            thisGraph.egid = 0;
            let edgeArr = require(path.join(parentDir, jobName, 'register.js'));
            edgeArr.forEach(function(e, i) {
                edgeArr[i] = {
                    id: i,
                    source: thisGraph.nodes.filter(n => n.title === e.source)[0],
                    target: thisGraph.nodes.filter(n => n.title === e.target)[0],
                    func: e.func
                };
                thisGraph.egid++;
            });
            thisGraph.edges = edgeArr;
            //console.log(thisGraph.edges)
            formatNodes(thisGraph, 300, 300);
            thisGraph.updateGraph()

            // let jobName = jsonObj.job ? jsonObj.job.name : undefined;
            // let newJob = new Job(thisGraph.nodes, thisGraph.edges, thisGraph.egid, thisGraph.idct, jobName);
            // addJob(jobsList, newJob)
            // selectJobAndUpdateView(thisGraph, jobsList, newJob.id);
        } catch(e) {
            alert(e.stack);
        }

        // thisGraph.egid = currentJob.edgeId;
        // thisGraph.idct = currentJob.idct;
        // thisGraph.nodes = currentJob.nodes;
        // thisGraph.edges = currentJob.edges;
        // thisGraph.updateGraph();
    }
    //read from file
    function readJson(jobName, thisGraph) {
        let txtRes = fs.readFileSync('lib/view/workflow/mydag.json', 'utf-8');
        var jsonObj = JSON.parse(txtRes);
        //init thisGraph.egid to 0
        thisGraph.egid = 0;
        thisGraph.nodes = jsonObj.nodes;

        //TODO move the attachInfo function into format just outside for now

        // validateGraphFormat(thisGraph);
        thisGraph.setIdCt(jsonObj.nodes.length + 1);
        var newEdges = jsonObj.edges;
        console.log(newEdges);
        newEdges.forEach(function (e, i) {
            // newEdges[i] = {
            //     id: i,
            //     source: thisGraph.nodes.filter(function (n) { return n.id == e.source; })[0],
            //     target: thisGraph.nodes.filter(function (n) { return n.id == e.target; })[0],
            //     func: e.func
            // };
            thisGraph.egid++;
        });
        thisGraph.edges = newEdges;
        

        //formatNodes(thisGraph, 300, 200);
        thisGraph.updateGraph();
    }

    //this function is used to manipulate the dom element when in and out the job edit mode
    function inAndOutEditMode() {
        $('.job-item').toggleClass('show-delete-function');
        editJobOrNot = !editJobOrNot;
        if (editJobOrNot) {
            $('#jobAdderContainer').css('display', 'none');
            $('#jobDelete').html('Quit Edit');
        } else {
            $('#jobAdderContainer').css('display', 'block');
            $('#jobDelete').html('Edit');
        }
    }
    //region ends

    //this function will return the newAdded job id number
    function addJob(jobsList, newJob) {
        //fs.mkdirSync(path.join(parentDir, newJob.name));
        jobsList.push(newJob);
        jobId++;
        generateJobSwitcher(jobsList);
        return jobId - 1;
    }

    function getJobById(jobsList, jobId) {
        let targetJob;
        jobsList.forEach(e => {
            if (e.id === jobId) {
                targetJob = e;
            }
        });

        return targetJob;
    }
    //this function has four condition and will select or return the job 
    //1. delete one is not selected job
    //2. it is selected one but not the last one. go back to the same index in the list
    //3. it is the last one in the list without an empty list
    //4. it is the last only item in the job list
    function deleteJob(jobsList, deleteJobId) {
        //TODO add a selectedJob global variable
        let deleteIndex;
        if (jobsList) {
            jobsList.forEach((e, i) => {
                if (e.id === parseInt(deleteJobId)) {
                    deleteIndex = i;
                    rmrf.sync(path.join(parentDir + '/' + e.name));
                    jobsList.splice(i, 1);
                }
            });
            if (selectedJob && selectedJob.id === deleteJobId) {
                if (jobsList.length > 0 && jobsList[deleteIndex]) {
                    return jobsList[deleteIndex].id;
                } else if (jobsList.length > 0 && !jobsList[deleteIndex]) {
                    return jobsList[deleteIndex - 1].id;
                }
            } else {
                return selectedJob.id;
            }
        }
        return -1;
    }

    // function updateView(currentJob) {
    // }

    function Job(nodes, edges, edgeId, idct, name) {
        this.name = name ? name : `Job${jobId + 1}`;
        this.id = jobId;
        this.nodes = nodes;
        this.edges = edges;
        this.edgeId = edgeId;
        this.idct = idct;
    }

    //this part is for generate the modal dynamic
    function ModalTemplate(modalName, modalContentArray) {
        this.modalName = modalName;
        //ModalContentItem Array
        this.modalContentArray = modalContentArray;
    }

    //for the nodes save to database
    function NodeInfo(graphNode) {
        this.id = graphNode.id;
        this.title = graphNode.title;
        this.func = graphNode.func;
        this.describe = graphNode.describe;
        this.x = graphNode.x;
        this.y = graphNode.y;
    }
    //this function is used to assign extra propTo a node object
    function extractPropertiesAndAssign(nodeObject) {
        let extraProps = {};
        $('#myModalDynamicArea .form-control ').each(
            function () {
                extraProps[this.id] = this.value;
            }
        );
        Object.assign(nodeObject, extraProps);
    }

    //this function is used to retrieve the propties and assign to form
    function retrieveProptiesAndAssign(nodeObject) {
        if (currentTemplate) {
            currentTemplate.content.forEach(contentItem => {
                $(`.form-group #${contentItem.inputId}`).val(
                    nodeObject ? nodeObject[contentItem.inputId] : contentItem.defaultValue
                );
            });
        }
    }

    function generateModalDynamically(modalTemplate) {
        let modalContentString = '';
        $('#dynamicModalHeader').html(modalTemplate.modalName);
        modalTemplate.modalContentArray.forEach(e => {
            let contentHtmlString = `<div class="form-group">
      <label for="${e.inputId}_input">${e.name}</label>
      <input type="${e.type}" name="${e.name}" class="form-control" id="${e.inputId}" placeholder="${e.defaultValue}"
          autofocus>
      </div>`;
            modalContentString = modalContentString + contentHtmlString;
        });

        $('#dynamicModalBody').html(modalContentString);
    }

    function generateModalDynamically2(modalTemplate) {
        currentTemplate = modalTemplate;
        let modalContentString = '';
        modalTemplate.content.forEach(e => {
            let contentHtmlString;
            if (e.type && e.type === 'select') {
                let optionsString = '';

                e.optionsInfo.forEach(optionInfo => {
                    if (e.defaultValue === optionInfo) {
                        optionsString = optionsString + `<option selected value="${optionInfo}">${optionInfo}</option>`
                    } else {
                        optionsString = optionsString + `<option value="${optionInfo}">${optionInfo}</option>`
                    }
                });

                contentHtmlString = `<div class="form-group"><label for="${e.inputId}">${e.name}</label><select class="form-control" id="${e.inputId}">${optionsString}</select></div>`;
            } else {
                contentHtmlString = `<div class="form-group"><label for="${e.inputId}">${e.name}</label><input type="${e.type}" name="${e.name}" class="form-control" id="${e.inputId}" placeholder="${e.defaultValue}"autofocus></div>`;
            }

            modalContentString = modalContentString + contentHtmlString;
        });

        $('#myModalDynamicArea').html(modalContentString);
    }

    function nodeFormInit(node) {
        $("#myModal").modal();
        $('input[name="txt_node_id"]').focus();
        let title = node ? node.title : consts.defaultTitle;
        let func = node ? +node.func : (templateMap ? Array.from(templateMap)[0][0] : 0);
        let describe = node ? node.describe : '';
        $('input[name="txt_node_id"]').val(title);
        $('select[name="txt_func"]').val(func).trigger('change');
        $('input[name="txt_statu"]').val(describe);
        retrieveProptiesAndAssign(node ? node : undefined);
    }

    function edgeFormInit(edge) {
    }

    function getInfoAndDisplay(infoObject) {
        let objectType = ''
        let objectInfoString = '';
        let nodeNotDisplayProperty = ['id', 'x', 'y'];
        let edgeNotDisplayProperty = ['id', 'source', 'target', 'children', 'parents'];
        if (infoObject) {
            if (infoObject['x']) {
                objectType = 'node';
            } else {
                objectType = 'edge';
            }
            objectInfoString = objectInfoString.concat(`<h4>${objectType}  info</h4>`);
            for (let propName in infoObject) {
                if (objectType === 'node') {
                    if (!nodeNotDisplayProperty.includes(propName)) {
                        if (propName === 'func') {
                            //let funcName = templateMap.get(parseInt(infoObject[propName])).funcName;
                            //objectInfoString = objectInfoString.concat(`<div>${propName} : ${funcName}</div>`);
                            objectInfoString = objectInfoString.concat(`<div>${propName} : ${infoObject[propName]}</div>`);
                        } else {
                            objectInfoString = objectInfoString.concat(`<div>${propName} : ${infoObject[propName]}</div>`);
                        }
                    }
                } else {
                    if (!edgeNotDisplayProperty.includes(propName)) {
                        objectInfoString = objectInfoString.concat(`<div>${propName} : ${infoObject[propName]}</div>`);
                    }
                }
            }
            $('#infoDisplayPanel').html(objectInfoString);
        }
    }
})(window.d3, window.saveAs, window.Blob);
