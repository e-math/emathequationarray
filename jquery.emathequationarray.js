/***
|''Name:''|emathequationarray.js|
|''Author:''|Petri Sallasmaa, Petri Salmela|
|''Description:''|Tool for showing math in equationarray-like structure|
|''Version:''|1.0|
|''Date:''|September 23, 2013|
|''License:''|[[GNU Affero General Public License|http://www.gnu.org/licenses/agpl-3.0.html]]|
|''~CoreVersion:''|2.6.2|
|''Contact:''|pesasa@iki.fi|
|''Dependencies ''|[[DataTiddlerPlugin]]|
|''Documentation:''| |

!!!!!Revisions
<<<
20130922.1045 ''start''
<<<

!!!!!Code
***/
//{{{
/*
 * jquery.emathequationarray.js
 * jQuery plugin for equationarray
 * and TiddlyWiki macro
 *
 * E-Math -project http://emath.eu
 * Petri Salmela
 * License: AGPL 3.0 or later
 *
 */

(function($){
    
    /**
     * emathdisplaymode
     * @param options
     */
    
    $.fn.emathequationarray = function(options) {
        
        if (methods[options]){
            return methods[options].apply( this, Array.prototype.slice.call( arguments, 1));
        } else if (typeof(options) === 'object' || !options) {
            return methods.init.apply(this, arguments);
        } else {
            $.error( 'Method ' +  options + ' does not exist on jQuery.emathequationarray' );
            return this;
        }
    };
    
    var methods = {
        init: function( options ){
            var settings = $.extend({
                latex: '',
                editable: false
            }, options);

            return this.each(function(){
                var eqnarray = new EmEqnarray(this, settings);
                eqnarray.init();
            });
        },
        get: function( options ){
            this.trigger('get_data');
            return this.data('emathequationarray_data'); // return the current value
        },
        geteditables: function( options ){
            this.trigger('geteditable_data');
            return this.data('emathequationarray_editable_data'); // return the current value
        },
        set: function( options ){
            if (typeof(options) === 'string'){
                this.trigger('set_data', [options]);
            }
        }
    };


    /****************************************************************
     * An Equation array
     ****************************************************************/
    
    var EmEqnarray = function(place, settings){
        settings = $.extend({
            eqnarray: [{left:'', middle:'', right:''}],
            editable: false,
            authormode: false
        }, settings);
        this.inited = false;
        this.place = $(place);
        this.eqnarray = [];
        this.settings = settings;
        this.editable = settings.editable;
        this.authormode = settings.authormode;
    };
    
    EmEqnarray.prototype.init = function(){
        var html = '<div class="emathequationarraybox"><table class="emathequationarray"><tbody></tbody></table></div>';
        this.place.html(html);
        this.content = this.place.find('tbody');
        this.draw();
        this.initData();
        
        this.initHandlers();
        if ($('head style#ematheqnarraycss').length < 1){
            $('head').append('<style type="text/css" id="ematheqnarraycss">' + this.strings.css + '</style>');
        }
        this.inited = true;
    };
    
    EmEqnarray.prototype.initData = function(){
        // Init rows with given data.
        for (var i = 0, length = this.settings.eqnarray.length; i < length; i++){
            this.addRow(this.settings.eqnarray[i]);
        }
    }
    
    EmEqnarray.prototype.addRow = function(options, rownum){
        // Add a row in rownum:th position.
        options = $.extend(true, {
            left: '',
            middle: '',
            right: '',
            editable: this.editable,
            editmodes: {left: false, middle: false, right: false},
            authormode: this.authormode
        }, options);
        $trlist = this.content.find('tr');
        if (typeof(rownum) !== 'number') {
            rownum = $trlist.length
        }
        var $newtr = $('<tr></tr>');
        if (rownum >= 0 && rownum < $trlist.length) {
            $trlist.eq(rownum).before($newtr);
        } else {
            this.content.append($newtr);
        }
        var row = new EmEqnRow($newtr, options);
        this.eqnarray.splice(rownum, 0, row);
        row.draw();
    }
    
    EmEqnarray.prototype.removeRow = function(rownum){
        // Remove row with given rownumber.
        this.eqnarray.splice(rownum, 1);
        this.content.find('tr').eq(rownum).remove();
        if (this.eqnarray.length === 0) {
            this.addRow();
        }
        this.changed();
    }
    
    EmEqnarray.prototype.setFocus = function(row, col){
        // Set focus on row (number) in given col ('left', 'middle', 'right').
        if (0 <= row && row < this.eqnarray.length) {
            this.eqnarray[row].setFocus(col);
        }
    }
    
    EmEqnarray.prototype.draw = function(){
        // Draw the equationarray.
        if (this.editable) {
            this.place.find('table').addClass('editable');
        } else {
            this.place.find('table').removeClass('editable');
        }
        this.content.find('tr').empty();
        for (var i = 0; i < this.eqnarray.length; i++){
            this.eqnarray[i].draw();
        }
    }
    
    EmEqnarray.prototype.initHandlers = function(){
        var eqnarray = this;
        this.place.unbind().bind('eqnarray_next', function(event, place){
            // Move to the next field.
            var $mqelems = eqnarray.content.find('.emeqnarray-math-editable');
            var index = $mqelems.index(place);
            if (index >= 0 && index < $mqelems.length - 1) {
                place.focusout().blur();
                $mqelems.eq(index + 1).focus();
            } else if (index === $mqelems.length -1) {
                place.focusout().blur();
                var trplace = place.parents('tr').eq(0);
                $(this).trigger('eqnarray_addrow', [trplace]);
            }
        }).bind('row_changed', function(event){
            eqnarray.changed();
        }).bind('eqnarray_goUp eqnarray_goDown eqnarray_goLeft eqnarray_goRight', function(event, place, direction){
            // Move in fields, Up, Down, Left, Right.
            var currentrow = place.parents('tr').eq(0);
            var $trlist = eqnarray.content.find('tr');
            var $mqlist = currentrow.find('.emeqnarray-math-editable');
            var row = $trlist.index(currentrow);
            var col = $mqlist.index(place);
            var horizmove = {
                Left: -1,
                Right: 1,
                Up: 0,
                Down: 0
            }
            var vertmove = {
                Left: 0,
                Right: 0,
                Up: -1,
                Down: 1
            }
            var newrow = Math.max(0, Math.min($trlist.length - 1, row + vertmove[direction]));
            var newcol = Math.max(0, Math.min(2, col + horizmove[direction]));
            eqnarray.content.find('.emeqnarray-math-editable').eq(3*newrow + newcol).focus();
        }).bind('eqnarray_addrow', function(event, place){
            // Add a row after current.
            var $trlist = eqnarray.content.find('tr');
            var index = $trlist.index(place) + 1;
            eqnarray.addRow({}, index);
            eqnarray.setFocus(index, 'left');
        }).bind('eqnarray_addrowcopy', function(event, place){
            // Add a copy of current row after current row.
            var $trlist = eqnarray.content.find('tr');
            var index = $trlist.index(place) + 1;
            eqnarray.addRow(eqnarray.eqnarray[index - 1].getData(), index);
            eqnarray.setFocus(index, 'left');
        }).bind('eqnarray_removerow', function(event, place){
            // Remove this (place) row.
            var $trlist = eqnarray.content.find('tr');
            var index = $trlist.index(place);
            eqnarray.removeRow(index);
            eqnarray.setFocus(index - 1, 'right');
        }).bind('get_data', function(event){
            eqnarray.place.data('emathequationarray_data', eqnarray.getData());
        }).bind('geteditable_data', function(event){
            eqnarray.place.data('emathequationarray_editable_data', eqnarray.getEditableFields());
        });
    }
    
    
    EmEqnarray.prototype.changed = function(){
        this.place.trigger('changed');
    }
    
    EmEqnarray.prototype.changeMode = function(mode){
        // Change the editmode ('view'/'edit').
        var modes = {view: false, edit: true};
        this.editable = (typeof(modes[mode]) !== undefined ? modes[mode] : this.editable);
        for (var i = 0; i < this.eqnarray.length; i++) {
            this.eqnarray[i].changeMode(mode);
        }
        this.draw();
    }
    
    EmEqnarray.prototype.getData = function(){
        // Return the data of this equation array.
        var result = {editable: this.editable, eqnarray: []};
        for (var i = 0; i < this.eqnarray.length; i++) {
            result.eqnarray.push(this.eqnarray[i].getData());
        }
        return result;
    }
    
    EmEqnarray.prototype.getEditableFields = function(){
        // Return data of editable fields as an array.
        var fields = this.place.find('.emeqnarray-math-editable');
        var result = [];
        for (var i = 0; i < fields.length; i++) {
            result.push(fields.eq(i).mathquill('latex'));
        }
        return result;
    }

    EmEqnarray.prototype.strings = {
        css: [
            '.emathequationarraybox {display: block; margin: 0.2em 0; text-align: center;}',
            '.emathequationarraybox table {display: inline-block; text-align: left; border: none;}',
            '.emathequationarraybox table td {border: none;}',
            '.emathequationarraybox table.editable {padding: 0.4em 1em;}',
            '.emathequationarraybox td.emeqnarray-left {text-align: right; min-width: 3em;}',
            '.emathequationarraybox td.emeqnarray-middle {text-align: center; min-width: 1em;}',
            '.emathequationarraybox td.emeqnarray-right {text-align: left; min-width: 3em;}',
            '.emathequationarraybox td.emeqnarray-rowactions {min-width: 40px; text-align: center;}',
            '.emathequationarraybox .mathquill-editable {border: 1px solid transparent; display: block;background-color: #f8f8f8; border-radius: 5px; padding: 0.2em 0.5em; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.5);}',
            '.emathequationarraybox .mathquill-editable.hasCursor {box-shadow: inset 1px 1px 2px rgba(0,0,0,0.5), inset -1px -1px 2px rgba(255,255,255,0.5), 0 0 3px 2px #68B4DF;}',
            '.emathequationarraybox table:not(.editable) .emeqnarray-math-editable {background-color: white;}',
            '.emathequationarraybox span.emeqnarray-buttontext {display: none;}',
            '.emathequationarraybox .emeqnarray-rowbutton {opacity: 0.1; cursor: pointer; display: inline-block; border-radius: 2px; transition: opacity 0.02s;}',
            '.emathequationarraybox tr:hover .emeqnarray-rowbutton {opacity: 1; transition: opacity 1s;}',
            '.emathequationarraybox .emeqnarray-removerowbutton svg {fill: red;}',
            '.emathequationarraybox .emeqnarray-newrowbutton svg {fill: green;}',
            '.emathequationarraybox .emeqnarray-newrowbutton {position: relative; bottom: -15px;}',
            '.emathequationarraybox .emeqnarray-authorlock {width: 10px; height: 10px; position: absolute; border-radius: 3px; cursor: pointer;}',
            '.emathequationarraybox .emeqnarray-authorlock .emeqnarray-locked {display: none; background-color: red; width: 10px; height: 10px; border-radius: 3px;}',
            '.emathequationarraybox .emeqnarray-authorlock.emeqnarray-lock-on .emeqnarray-locked {display: block;}',
            '.emathequationarraybox .emeqnarray-authorlock .emeqnarray-unlocked {display: block; background-color: green; width: 10px; height: 10px; border-radius: 3px;}',
            '.emathequationarraybox .emeqnarray-authorlock.emeqnarray-lock-on .emeqnarray-unlocked {display: none;}'
        ].join('\n')
    };
    
    EmEqnarray.icons = {
        trash: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="20" height="20" viewbox="0 0 30 30" class="mini-icon mini-icon-trashcan-open"><path style="stroke: none;" d="M5 5.5 l7 -2 l-0.2 -1 l2 -0.4 l0.2 1 l7 -2 l0.6 2 l-16 4.4 z M7 8 l16 0 l-3 20 l-10 0z M9 10 l2 15 l2 0 l-1 -15z M13.5 10 l0.5 15 l2 0 l0.5 -15z M21 10 l-3 0 l-1 15 l2 0z" /></svg>',
        newrow: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="20" height="20" viewbox="0 0 30 30" class="mini-icon mini-icon-newrow"><path style="stroke: none;" d="M13 7 l4 0 l0 6 l6 0 l0 4 l-6 0 l0 6 l-4 0 l0 -6 l-6 0 l0 -4 l6 0z" /></svg>',
        copyrow: '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="20" height="20" viewbox="0 0 30 30" class="mini-icon mini-icon-copyrow"><path style="fill: black; stroke: none;" d="M20 2 l4 0 l0 6 l6 0 l0 4 l-6 0 l0 6 l-4 0 l0 -6 l-6 0 l0 -4 l6 0z" /><path style="stroke: none;" d="M8 11 l4 0 l0 6 l6 0 l0 4 l-6 0 l0 6 l-4 0 l0 -6 l-6 0 l0 -4 l6 0z" /></svg>'
    }
    
    
    /****************************************************************
     ****************************************************************
     * Row of an equation array
     ****************************************************************
     ****************************************************************/
    
    
    var EmEqnRow = function(place, options){
        // Class for a row in equationarray
        this.place = place;
        this.left = options.left || '';
        this.middle = options.middle || '';
        this.right = options.right || '';
        this.editable = options.editable;
        this.editmodes = $.extend({}, options.editmodes);
        this.authormode = options.authormode;
        this.inited = false;
    }
    
    EmEqnRow.prototype.draw = function(){
        // Draw formulas
        if (this.editable) {
            this.edit();
        } else {
            this.show();
        }
    }
    
    EmEqnRow.prototype.show = function(){
        // Show static math
        var html = [
            '<td class="emeqnarray-left"><span class="emeqnarray-math'+(this.editmodes['left'] ? '-editable' : '')+'">'+this.left+'</span></td>',
            '<td class="emeqnarray-middle"><span class="emeqnarray-math'+(this.editmodes['middle'] ? '-editable' : '')+'">'+this.middle+'</span></td>',
            '<td class="emeqnarray-right"><span class="emeqnarray-math'+(this.editmodes['right'] ? '-editable' : '')+'">'+this.right+'</span></td>'
        ].join('\n');
        this.place.html(html).find('.emeqnarray-math').mathquill();
        this.place.find('.emeqnarray-math-editable').mathquill('editable');
        this.inited = true;
    }
    
    EmEqnRow.prototype.edit = function(){
        // Show math in editmode
        var authorlock = (this.authormode ? '<div class="emeqnarray-authorlock emeqnarray-lock-on"><div class="emeqnarray-locked"></div><div class="emeqnarray-unlocked"></div></div>' : '');
        var html = [
            '<td class="emeqnarray-rowactions"><span class="emeqnarray-rowbutton emeqnarray-newrowbutton">'+EmEqnarray.icons.newrow+'<span class="emeqnarray-buttontext">New row</span></span></td>',
            '<td class="emeqnarray-left">'+authorlock+'<span class="emeqnarray-math-editable" data-field="left">'+this.left+'</span></td>',
            '<td class="emeqnarray-middle">'+authorlock+'<span class="emeqnarray-math-editable" data-field="middle">'+this.middle+'</span></td>',
            '<td class="emeqnarray-right">'+authorlock+'<span class="emeqnarray-math-editable" data-field="right">'+this.right+'</span></td>',
            '<td class="emeqnarray-rowactions"><span class="emeqnarray-rowbutton emeqnarray-removerowbutton">'+EmEqnarray.icons.trash+'<span class="emeqnarray-buttontext">Remove</span></span></td>'
        ].join('\n');
        this.place.html(html);
        var elements = this.place.find('.emeqnarray-math-editable').mathquill('editable');
        this.leftelem = elements.eq(0);
        this.middleelem = elements.eq(1);
        this.rightelem = elements.eq(2);
        this.initHandlers();
        this.inited = true;
    }
    
    EmEqnRow.prototype.initHandlers = function(){
        // Init handlers for fields.
        var eqnrow = this;
        this.place.undelegate('.emeqnarray-math-editable', 'focusout')
            .delegate('.emeqnarray-math-editable', 'focusout', function(event){
            // focusout-events for fields.
            var $mqfield = $(this);
            var field = $mqfield.attr('data-field');
            var newdata = $mqfield.mathquill('latex');
            if (eqnrow[field] !== newdata) {
                eqnrow[field] = newdata;
                eqnrow.changed();
            }
        }).undelegate('.emeqnarray-math-editable', 'keydown')
            .delegate('.emeqnarray-math-editable', 'keydown', function(event){
            // keypress-events for fields.
            event.stopPropagation();
            //event.preventDefault();
            var $mqfield = $(this);
            var field = $mqfield.attr('data-field');
            switch (event.keyCode){
                case 13:
                    if (event.ctrlKey) {
                        $mqfield.focusout().blur();
                        eqnrow.place.trigger('eqnarray_addrow', [eqnrow.place]);
                        eqnrow.changed();
                    } else if (event.shiftKey) {
                        $mqfield.focusout().blur();
                        eqnrow.place.trigger('eqnarray_addrowcopy', [eqnrow.place]);
                        eqnrow.changed();
                    } else {
                        eqnrow.place.trigger('eqnarray_next', [$mqfield]);
                    }
                    break;
                case 38:
                case 40:
                case 37:
                case 39:
                    if (event.ctrlKey) {
                        var keys = {37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down'};
                        eqnrow.place.trigger('eqnarray_go'+keys[event.keyCode], [$mqfield, keys[event.keyCode]]);
                    }
                    break;
                case 8:
                    if (event.ctrlKey) {
                        eqnrow.place.trigger('eqnarray_removerow', [eqnrow.place]);
                        eqnrow.changed();
                    }
                default:
                    break;
            }
        }).undelegate('.emeqnarray-removerowbutton', 'click')
            .delegate('.emeqnarray-removerowbutton', 'click', function(event){
            // Click-events for removerow-buttons.
            event.preventDefault();
            eqnrow.place.trigger('eqnarray_removerow', [eqnrow.place]);
            eqnrow.changed();
        }).undelegate('.emeqnarray-newrowbutton', 'click')
            .delegate('.emeqnarray-newrowbutton', 'click', function(event){
            // Click-events for newrow-buttons.
            event.preventDefault();
            var $mqfield = $(this).parents('tr').find('.hasCursor');
            $mqfield.focusout().blur();
            eqnrow.place.trigger('eqnarray_addrow', [eqnrow.place]);
            eqnrow.changed();
        }).undelegate('.emeqnarray-authorlock', 'click')
            .delegate('.emeqnarray-authorlock', 'click', function(event){
            // Click-events for newrow-buttons.
            event.preventDefault();
            var $lock = $(this);
            var field = $lock.parent('td').find('[data-field]').attr('data-field');
            eqnrow.toggleLock(field);
            $lock.toggleClass('emeqnarray-lock-on');
            eqnrow.changed();
        });
    }
    
    EmEqnRow.prototype.setFocus = function(col){
        // Set focus in col ('left', 'middle', 'right')
        this.place.find('.emeqnarray-math-editable[data-field="'+col+'"]').focus();
    }
    
    EmEqnRow.prototype.changed = function(){
        // Trigger changed-event.
        this.place.trigger('row_changed');
    }
    
    
    EmEqnRow.prototype.toggleLock = function(field){
        // Toggle editmode of field.
        this.editmodes[field] = !this.editmodes[field];
    }
    
    EmEqnRow.prototype.changeMode = function(mode){
        // Change the editmode ('view'/'edit').
        var modes = {view: false, edit: true};
        this.editable = (typeof(modes[mode]) !== undefined ? modes[mode] : this.editable);
    }
    
    EmEqnRow.prototype.getData = function(){
        // Return the data of this row.
        return {
            left: this.left,
            middle: this.middle,
            right: this.right,
            editmodes: {
                left: this.editmodes.left,
                middle: this.editmodes.middle,
                right: this.editmodes.right
            }
        };
    }


    

    
})(jQuery)

if (typeof(config) !== 'undefined' && typeof(config.macros) !== 'undefined'){
    // Create macro for TiddlyWiki
    config.macros.emathequationarray = {
        /******************************
         * Show emathequationarray
         ******************************/
        handler: function (place, macroName, params, wikifier, paramString, tiddler)
        {
            if (params.length < 1){
                wikify('Missing equationarray.', place, null, tiddler);
                return false;
            }
            var eqnarrayid = params[0];
            var iseditable = (params[1] === 'edit' || params[1] === 'author' || params[1] === 'authordialog');
            var isauthor = (params[1] === 'authordialog' || params[1] === 'author');
            var emtabletext = '{{emathequationarraywrapper ematheqnarray_'+eqnarrayid+'{\n}}}';
            wikify(emtabletext, place);
            if (tiddler) {
                var settings = jQuery.extend(true, {}, tiddler.data('ematheqnarray',{}));
            } else {
                var settings = {};
            }
            settings[eqnarrayid] = settings[eqnarrayid] || {};
            settings[eqnarrayid].editable = iseditable;
            settings[eqnarrayid].authormode = isauthor;
            var eqnarray = jQuery(place).find('.emathequationarraywrapper.ematheqnarray_'+eqnarrayid).last().emathequationarray(settings[eqnarrayid])
            if (iseditable &&  params[1] !== 'authordialog') {
                eqnarray.bind('changed', function(e){
                    var $emeqnarrplace = jQuery(this);
                    var data = $emeqnarrplace.emathequationarray('get');
                    var settings = tiddler.data('ematheqnarray', {});
                    settings[eqnarrayid] = data;
                    var autosavestatus = config.options.chkAutoSave;
                    config.options.chkAutoSave = false;
                    tiddler.setData('ematheqnarray', settings);
                    config.options.chkAutoSave = autosavestatus;
                });
            }
            return true;
            
        }
    }
}
//}}}