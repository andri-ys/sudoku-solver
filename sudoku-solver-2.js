var sudokuBoardElement = function(board, x, y){
	return {
		_board: board,
		_i: x,
		_j: y,
	
		_validateValue: function(val){
			var i = parseInt(val);
			switch (i){
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
				case 6:
				case 7:
				case 8:
				case 9:
					return i;
			}
			return false;
		},		
	
		alt: {},
		
		reset: function(){
			for (var i = 1; i <= 9; i++){
				this.alt[i] = true;
			}
			return this;
		},
		
		disable: function(i){
			this.alt[i] = false;
			return this;
		},
				
		getPossibleValues: function(){
			var arr = [];
			for (var i = 1; i <= 9; i++){
				if (this.alt[i]){
					arr.push(i);
				}
			}
			return arr;
		},
		
		_setValue: function(val){
			var validVal = this._validateValue(val);
			if (validVal){
				this.alt = {};
				this.alt[validVal] = true;
			}
			return this;
		},
	
		trySetValue: function(val){
			if (this.alt[val]){
				this._setValue(val);
				return true;
			}
			return false;
		},
	
		getValue: function(){		
			var arr = this.getPossibleValues();
			if (arr.length == 1){
				return arr[0];
			}else{
				return "";
			}
		},
		
		getPossibleValueString: function(){
			var arr = this.getPossibleValues();
			var val = "";
			for (var idx in arr){
				val += arr[idx].toString();
			}
			return val;
		}
	}.reset();
}

var sudokuBoard = function(){
	return {
		_idx: function(i, j){
			return i + "." + j;
		},
	
		elements: {},
		valueSet: {},
		_init: function(){
			this.elements = {};
			for (var i = 0; i <= 8; i++){
				for (var j = 0; j <= 8; j++){
					this.elements[this._idx(i, j)] = new sudokuBoardElement(this, i, j);
				}
			}
			this.valueSet = {};
			return this;
		},
		
		_saveState: function(){
			var state = [];			
			for (var i = 0; i <= 8; i++){
				for (var j = 0; j<= 8; j++){
					state.push(this.getElement(i, j).getValue());
				}
			}
			return state;
		},
		_loadState: function(state){
			this._init();
			var idx = 0;
			for (var i = 0; i <= 8; i++){
				for (var j = 0; j <= 8; j++){
					this._setElementValue(i, j, state[idx]);
					idx++;
				}
			}
		},
		
		getElement: function(i, j){
			return this.elements[this._idx(i, j)];
		},		
		getColumnSiblingElements: function(i, j){
			var arr = [];
			for (var k = 0; k <= 8; k++){
				if (k != j){
					arr.push(this.getElement(i, k));
				}
			}
			return arr;
		},		
		getRowSiblingElements: function(i, j){
			var arr = [];
			for (var k = 0; k <= 8; k++){
				if (k != i){
					arr.push(this.getElement(k, j));
				}
			}
			return arr;
		},
		_getGroupRangeIndex: function(idx){
			switch (idx){
				case 0:
				case 1:
				case 2:
					return { min: 0, max: 2 };
				case 3:
				case 4:
				case 5:
					return { min: 3, max: 5 };
				case 6:
				case 7:
				case 8:
					return { min: 6, max: 8 };					
			}
			return false;
		},
		getGroupSiblingElements: function(i, j){
			var arr = [];
			
			var ii = this._getGroupRangeIndex(i);
			var jj = this._getGroupRangeIndex(j);
			
			for (var k1 = ii.min; k1 <= ii.max; k1++){
				for (var k2 = jj.min; k2 <= jj.max; k2++){
					if (k1 != i || k2 != j){
						arr.push(this.getElement(k1, k2));
					}
				}
			}
			return arr;
		},
		getAllSiblingElements: function(i, j){
			var col = this.getColumnSiblingElements(i, j);
			var row = this.getRowSiblingElements(i, j);
			
			var arr = [];
			var ii = this._getGroupRangeIndex(i);
			var jj = this._getGroupRangeIndex(j);			
			for (var k1 = ii.min; k1 <= ii.max; k1++){
				for (var k2 = jj.min; k2 <= jj.max; k2++){
					if (k1 != i && k2 != j){						
						arr.push(this.getElement(k1, k2));
					}
				}
			}
			
			for (var idx in col){
				arr.push(col[idx]);
			}
			for (var idx in row){
				arr.push(row[idx]);
			}
			
			return arr;
		},
		
		_setElementValue: function(i, j, val){
			var elmt = this.getElement(i, j);
			if (elmt.trySetValue(val)){
				this.valueSet[this._idx(i, j)] = true;
				var newVal = elmt.getValue();
				
				var siblings = this.getAllSiblingElements(i, j);
				for (var idx in siblings){
					siblings[idx].disable(newVal);
				}
				return true;
			}
			return false;
		},			
		
		_execute: function(){
			do{
				var count = 0;
				for (var i = 0; i <= 8; i++){
					for (var j = 0; j <= 8; j++){
						if (!this.valueSet[this._idx(i, j)] && this.getElement(i, j).getValue()){
							this._setElementValue(i, j, this.getElement(i, j).getValue());
							count++;
						}
					}
				}
			}while (count > 0);
		},
		
		_getBoardStatus: function(){
			var status = { solved: true, solvable: true, item: null };			
			for (var i = 0; i <= 8; i++){
				for (var j = 0; j <= 8; j++){
					var alt = this.getElement(i, j).getPossibleValues();
					status.solved = status.solved && (alt.length == 1);
					status.solvable = status.solvable && (alt.length > 0);
					if (alt.length > 1){
						if (!status.item || (status.item.getPossibleValues().length > alt.length)){
							status.item = this.getElement(i, j);
						}
					}
				}
			}
			return status;
		},
		
		_stack: [],
		solve: function(){
			this._stack = [];
			this._execute();
			
			var status = this._getBoardStatus();
			if (status.solved){
				return true;
			}
			
			if (!status.solvable){
				return false;
			}
			
			var state = this._saveState();
			var alt = status.item.getPossibleValues();
			for (var idx in alt){
				this._stack.push({ state: state, i: status.item._i, j: status.item._j, val: alt[idx] });
			}
			
			do{
				exec = this._stack.pop();
				this._loadState(exec.state);
				this._setElementValue(exec.i, exec.j, exec.val);
				this._execute();
				
				status = this._getBoardStatus();				
				if (!status.solved && status.solvable){
					state = this._saveState();
					alt = status.item.getPossibleValues();
					for (var idx in alt){
						this._stack.push({ state: state, i: status.item._i, j: status.item._j, val: alt[idx] });
					}
				}
			}while (!status.solved && this._stack.length > 0);
			
			return status.solved;
		},
		
		onGetValue: function(i, j){
			alert('Please replace this onGetValue(i, j) function to get the board value of position [i,j] (i, j between 0-8)');
			return false;
		},
		getValues: function(f){
			if (f){
				onGetValue = f;
			}
			for (var i = 0; i <= 8; i++){
				for (var j = 0; j<= 8; j++){
					this._setElementValue(i, j, onGetValue(i, j));
				}
			}
		},
		
		onShowValue: function(i, j, val){
			alert("Please replace this onShowValue(i, j, val) function with one that suits your need\r\nThe board value at position [i:" + i + ", j:" + j + "] is val:'" + val + "'");
		},
		showValues: function(f){
			if (f){
				this.onShowValue = f;
			}
			for (var i = 0; i <= 8; i++){
				for (var j = 0; j<= 8; j++){
					var val = this.getElement(i, j).getValue();
					if (!val){
						val = this.getElement(i, j).getPossibleValueString();
					}
					this.onShowValue(i, j, val);
				}
			}
		}
	}._init();
}

function clearSudoku(){
	for (i = 1; i <= 9; i++){
		for (j = 1; j <= 9; j++){
			document.getElementById('s' + i + j).value = '';
		}
	}
}

function solveSudoku(){
	var sudoku = new sudokuBoard();

	sudoku.getValues(function(i, j){
		return document.getElementById('s' + (i + 1) + (j + 1)).value;
	});
	
	if (!sudoku.solve()){
		alert("Can't solve this sudoku");
	}

	sudoku.showValues(function(i, j, val){
		document.getElementById('s' + (i + 1) + (j + 1)).value = val;
	});
}