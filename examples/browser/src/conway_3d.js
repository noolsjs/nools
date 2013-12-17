(function () {
    /*global Cell, $, patterns, window, THREE, requestAnimationFrame, declare, stats*/

    var _ = this.extended().register(this.isExtended).register(this.functionExtended);

    var Conwas3d = declare({
        instance: {

            step: 20,
            defaultDimensions: 30,
            session: null,
            scene: null,
            renderer: null,
            stopped: true,
            constructor: function (domNode, dimension, flow) {
                this.statsListener = stats();
                this.cubeSize = this.step / 2;
                this.flow = flow;
                var innerHeight = window.innerHeight, innerWidth = window.innerWidth;
                var container = this.container = $(domNode);
                container.css({width: innerWidth + "px", height: innerHeight + "px"});

                var camera = this.camera = new THREE.PerspectiveCamera(100, innerWidth / innerHeight, 1, 10000);
                camera.position.set(0.01, (dimension || this.defaultDimensions) * 25, 0.01);


                var controls = this.controls = new THREE.OrbitControls(camera, container[0]);
                controls.addEventListener('change', _.bind(this, "render"));
                var scene = this.scene = new THREE.Scene();

                var light = new THREE.SpotLight(0x00CCFF, 1);//Math.random() * 0xffffff, 2 );
                light.position.set(0, 500, 2000);
                light.castShadow = true;
                scene.add(light);

                var light2 = new THREE.SpotLight(0xCCCCCC, 1);//Math.random() * 0xffffff, 2 );
                light2.position.set(0, -400, -1800);
                light2.castShadow = true;
                scene.add(light2);


                var renderer = this.renderer = new THREE.WebGLRenderer({
                    shadowCameraFov: camera.fov,
                    shadowMapBias: 0.0039,
                    shadowMapDarkness: 0.5,
                    shadowMapWidth: 2048,
                    shadowMapHeight: 2048,
                    shadowMapEnabled: true,
                    shadowMapSoft: true
                });
                renderer.setSize(window.innerWidth, window.innerHeight);
                container.append(renderer.domElement);

                _.bindAll(this, ["reset", "__errorHandler", "onWindowResize", "run", "render", "clear", "addCell", "createGrid", "setCellState", "__applyPattern", "stop", "onWindowResize", "animate", "__setCellState", "__disposeAndReset"]);
                window.addEventListener('resize', this.onWindowResize);
                this.set("pattern", "random");
                this.set("dimensions", (dimension || this.defaultDimensions));
                this.animate();
            },

            reset: function () {
                return this.stop().__applyPattern();
            },

            __errorHandler: function (err) {
                console.log(err.stack);
            },

            __setCellState: function (cell) {
                if (cell.state === "live") {
                    this.scene.add(cell.cube);
                } else {
                    this.scene.remove(cell.cube);
                }
            },

            __disposeAndReset: function () {
                this.session.dispose();
                if (!this.stopped) {
                    this.reset();
                    this.__matchPromise = null;
                    return this.run();
                }
                return this;
            },

            run: function () {
                var session;
                if (this.stopped && !this.__matchPromise) {
                    this.stopped = false;
                    this.__matchPromise = this.statsListener.listen(this.session = this.flow
                            .getSession(this.cells))
                        .focus("populate")
                        .on("cell-transition", this.__setCellState)
                        .on("evaluate", this.render)
                        .matchUntilHalt();
                    this.__matchPromise.addCallback(this.__disposeAndReset).addErrback(this.__errorHandler);
                }
                return this;

            },

            clear: function () {
                return this.stop().__applyPattern([]).render();
            },

            addCell: function (x, z, y, cell) {
                var cells = this.cells;
                if (!cells[x]) {
                    cells[x] = [];
                }
                if (!cells[x][z]) {
                    cells[x][z] = [];
                }
                cells[x][z][y] = cell;
                return cell;
            },

            createGrid: function () {
                var cubeSize = this.cubeSize, rows = this.rows, cols = this.cols, depth = this.depth, cells = this.cells, size = this.size, addCell = this.addCell, step = this.step;
                var geometry = new THREE.CubeGeometry(cubeSize, cubeSize, cubeSize);
                var originX = -1 * (size - (step / 2)), originZ = -1 * originX, cell;
                for (var row = 0; row < rows; row++) {
                    var x = originX + (row * step);
                    for (var col = 0; col < cols; col++) {
                        var z = originZ - (col * step);
                        for (var colDepth = 0; colDepth < depth; colDepth++) {
                            var cube = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: 0xffffff}));
                            cube.position.z = z;
                            cube.position.x = x;
                            cube.position.y = originZ - (colDepth * step);
                            cell = addCell(row, col, colDepth, new Cell(row, col, colDepth));
                            cell.cube = cube;
                            var aboveRow = cells[row - 1], currRow = cells[row];
                            if (row > 0) {
                                //row/col north
                                cell.addNeighbor(aboveRow[col][colDepth]);
                                if (col < cols - 1) {
                                    //row/col north east
                                    cell.addNeighbor(aboveRow[col + 1][colDepth]);
                                }
                                if (col > 0) {
                                    //row/col north west
                                    cell.addNeighbor(aboveRow[col - 1][colDepth]);
                                }
                                if (colDepth > 0) {
                                    //register above row/col/colDepth
                                    //register above row/col/colDepth - 1
                                    cell.addNeighbor(aboveRow[col][colDepth - 1]);
                                    if (col > 0) {
                                        cell.addNeighbor(aboveRow[col - 1][colDepth - 1]);
                                    }
                                    if (col < cols - 1) {
                                        cell.addNeighbor(aboveRow[col + 1][colDepth - 1]);
                                    }
                                }
                                if (colDepth < depth - 1) {
                                    //register above row/col/colDepth + 1
                                    cell.addNeighbor(aboveRow[col][colDepth + 1]);
                                    if (col > 0) {
                                        cell.addNeighbor(aboveRow[col - 1][colDepth + 1]);
                                    }
                                    if (col < cols - 1) {
                                        cell.addNeighbor(aboveRow[col + 1][colDepth + 1]);
                                    }
                                }
                            }
                            if (col > 0) {

                                if (row >= 0) {
                                    //row/col west
                                    cell.addNeighbor(currRow[col - 1][colDepth]);
                                }
                                if (colDepth > 0) {
                                    cell.addNeighbor(currRow[col - 1][colDepth - 1]);
                                }
                                if (colDepth < depth - 1) {
                                    //register below previous column
                                    cell.addNeighbor(currRow[col - 1][colDepth + 1]);
                                }
                            }
                            if (colDepth > 0) {
                                //register above
                                cell.addNeighbor(currRow[col][colDepth - 1]);
                            }
                        }
                    }
                }
                return this;
            },

            setCellState: function (cell, isAlive) {
                cell.state = isAlive ? "live" : "dead";
                this.__setCellState(cell);
            },

            __applyPattern: function (pattern) {
                if (this.cells && this.cells.length) {
                    var row, col, cells = this.cells, rows = this.rows, cols = this.cols, depth = this.depth;
                    pattern = pattern || this.__pattern(rows, cols, depth);
                    for (var i = 0; i < rows; i++) {
                        row = pattern[i] || [];
                        for (var j = 0; j < cols; j++) {
                            col = row[j] || [];
                            for (var k = 0; k < depth; k++) {
                                this.setCellState(cells[i][j][k], col[k] || false);
                            }
                        }
                    }
                    return this.render();
                }
                return this;
            },

            stop: function (reset) {
                reset = _.isBoolean(reset) ? reset : false;
                if (this.session) {
                    this.stopped = true;
                    var session = this.session;
                    if (session) {
                        session.halt();
                        session.dispose();
                    }
                    if (this.__matchPromise) {
                        this.__matchPromise = this.__matchPromise.then(_.bind(this, function () {
                            if (reset) {
                                this.reset();
                            }
                            this.__matchPromise = null;
                        }));
                    }
                }
                return this;
            },

            onWindowResize: function () {
                var camera = this.camera;
                camera.left = window.innerWidth / -2;
                camera.right = window.innerWidth / 2;
                camera.top = window.innerHeight / 2;
                camera.bottom = window.innerHeight / -2;
                camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);

            },

            animate: function () {
                requestAnimationFrame(this.animate);
                this.controls.update();
            },
            render: function () {
                this.renderer.render(this.scene, this.camera);
                return this;
            },

            setters: {
                pattern: function (pattern) {
                    this.stop();
                    this.__pattern = patterns[pattern];
                    this.__applyPattern().reset();
                    return this;
                },

                dimensions: function (dim) {
                    this.stop().clear();
                    this.size = dim * this.step / 2;
                    this.rows = this.cols = this.depth = dim;
                    this.cells = [];
                    this.createGrid().__applyPattern();
                    return this;
                },

                flow: function (flow) {
                    var stopped = this.stopped;
                    this.stop().flow = flow;
                    if (!stopped) {
                        this.__matchPromise.then(this.run);
                    }


                }
            }

        }
    });
    this.conways = function (domNode, dimesions, flow) {
        return new Conwas3d(domNode, dimesions, flow);
    };
}).call(this);
