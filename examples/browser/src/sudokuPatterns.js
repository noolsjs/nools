(function () {

    this.sudokuExamples = {
        Simple: [
            [null, 5, 6, 8, null, 1, 9, 4, null],
            [9, null, null, 6, null, 5, null, null, 3],
            [7, null, null, 4, 9, 3, null, null, 8],
            [8, 9, 7, null, 4, null, 6, 3, 5],
            [null, null, 3, 9, null, 6, 8, null, null],
            [4, 6, 5, null, 8, null, 2, 9, 1],
            [5, null, null, 2, 6, 9, null, null, 7],
            [6, null, null, 5, null, 4, null, null, 9],
            [null, 4, 9, 7, null, 8, 3, 5, null]
        ],

        Medium: [
            [8, 4, 7, null, null, null, 2, 5, 6],
            [5, null, null, null, 8, null, null, null, 4],
            [2, null, null, null, 7, null, null, null, 8],
            [null, null, null, 3, null, 8, null, null, null],
            [null, 5, 1, null, null, null, 8, 7, 2],
            [null, null, null, 5, null, 7, null, null, null],
            [4, null, null, null, 5, null, null, null, 7],
            [6, null, null, null, 3, null, null, null, 9],
            [1, 3, 2, null, null, null, 4, 8, 5]
        ],

        "Hard 1": [
            [null, null, null, null, 5, 1, null, 8, null],
            [null, 8, null, null, 4, null, null, null, 5],
            [null, null, 3, null, null, null, 2, null, null],
            [null, null, null, null, 6, null, null, null, 9],
            [6, 7, null, 4, null, 9, null, 1, 3],
            [8, null, null, null, 3, null, null, null, null],
            [null, null, 2, null, null, null, 4, null, null],
            [5, null, null, null, 9, null, null, 2, null],
            [null, 9, null, 7, 1, null, null, null, null]
        ],

        "Hard 2": [
            [null, null, null, 6, null, null, 1, null, null],
            [null, null, null, null, null, 5, null, null, 6],
            [5, null, 7, null, null, null, 2, 3, null],
            [null, 8, null, 9, null, 7, null, null, null],
            [9, 3, null, null, null, null, null, 6, 7],
            [null, null, null, 4, null, 6, null, 1, null],
            [null, 7, 4, null, null, null, 9, null, 1],
            [8, null, null, 7, null, null, null, null, null],
            [null, null, 3, null, null, 8, null, null, null]
        ],

        "Hard 3": [
            [null, 8, null, null, null, 6, null, null, 5],
            [2, null, null, null, null, null, 4, 8, null],
            [null, null, 9, null, null, 8, null, 1, null],
            [null, null, null, null, 8, null, 1, null, 2],
            [null, null, null, 3, null, 1, null, null, null],
            [6, null, 1, null, 9, null, null, null, null],
            [null, 9, null, 4, null, null, 8, null, null],
            [null, 7, 6, null, null, null, null, null, 3],
            [1, null, null, 7, null, null, null, 5, null]
        ],

        "Hard 4": [
            [null, null, null, null, null, 4, null, 9, 5],
            [6, 7, null, 5, null, null, null, 1, null],
            [null, null, null, 6, null, 9, null, null, null],
            [null, 2, null, null, null, null, 4, null, null],
            [8, 1, null, null, null, null, null, 7, 2],
            [null, null, 7, null, null, null, null, 8, null],
            [null, null, null, 3, null, 5, null, null, null],
            [null, 6, null, null, null, 1, null, 5, 8],
            [7, 3, null, 9, null, null, null, null, null]
        ],

        "Broken": [
            [5, null, null, null, null, 4, null, 9, 5],
            [6, 7, null, 5, null, null, null, 1, null],
            [null, null, null, 6, null, 9, null, null, null],
            [null, 2, null, null, null, null, 4, null, null],
            [8, 1, null, null, null, null, null, 7, 2],
            [null, null, 7, null, null, null, null, 8, null],
            [8, null, null, 3, null, 5, null, null, null],
            [null, 6, null, null, null, 1, null, 5, 8],
            [7, 3, null, 9, null, null, null, null, null]
        ]

    };

}).call(this);