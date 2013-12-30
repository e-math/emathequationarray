Emathequationarray
==============

See the [demo page](http://e-math.github.io/emathequationarray).

What?
-----
A tool for creating a LaTeX-like equationarray on a web-page. Both in view mode and
editable mode. Also mixed partially editable state is available.

How?
----
Emathequationarray is a jQuery-plugin and can be embedded on any web page
by including `jquery.emathequationarray.js`-file and defining some html-element
as a equationarray with: `$('#mydiv').emathequationarray()`.

Emathequationarray depends on external JavaScript libraries:
* MathQuill
* jQuery

Who?
----
The tool was developed in EU-funded [E-Math -project](http://emath.eu) by
* Petri Salmela
* Petri Sallasmaa

and the copyrights are owned by [Four Ferries oy](http://fourferries.fi).

License?
--------
The tool is licensed under [GNU AGPL](http://www.gnu.org/licenses/agpl-3.0.html).
The tool depends on some publicly available open source components with other licenses:
* [jQuery](http://jquery.com) (MIT-license)
* [MathQuill](http://mathquill.com/) (GNU LGPL)



Usage
======
Initing an equationarray
----
Init a new, empty, editable equationarray
```javascript
jQuery('#box').emathequationarray({editable: true});
```

Init a new equationarray in editing mode with existing data.
```javascript
jQuery('.box').emathequationarray({
    editable: true,
    authormode: false,
    eqnarray: [
        {
            left: "3x+1",
            middle: "=",
            right: "4x-8"
        },
        {
            left: "3x",
            middle: "=",
            right: "4x-9"
        },
        {
            left: "-x",
            middle: "=",
            right: "-9"
        },
        {
            left: "x",
            middle: "=",
            right: "9"
        }
    ]
});
```

Init a new equationarray in view mode with existing data.
```
jQuery('#box').emathequationarray({
    editable: false,
    eqnarray: [
        {
            left: "3x+1",
            middle: "=",
            right: "4x-8"
        },
        {
            left: "3x",
            middle: "=",
            right: "4x-9"
        },
        {
            left: "-x",
            middle: "=",
            right: "-9"
        },
        {
            left: "x",
            middle: "=",
            right: "9"
        }
    ]
});
```

Init a new equationarray in view mode with existing data and with some fields editable.
```
jQuery('#box').emathequationarray({
    editable: false,
    eqnarray: [
        {
            left: "3x+1",
            middle: "=",
            right: "4x-8",
            editmodes: {
                left: true,
                middle: false,
                right: false
            }
        },
        {
            left: "3x",
            middle: "=",
            right: "4x-9",
            editmodes: {
                left: false,
                middle: true,
                right: false
            }

        },
        {
            left: "-x",
            middle: "=",
            right: "-9"
        },
        {
            left: "x",
            middle: "=",
            right: "9"
        }
    ]
});
```

Getting data from table
-----------------------

Get the data as a JavaScript object from the table in html-element with
id `#box`.
```javascript
var data = jQuery('#box').emathtable('get');
```

Edit mode
-----------

In edit mode you can:
* **Change the style** of the table from the menu behind the gear button.
* **Add or remove** rows and columns in add/remove mode which is started and stopped with plus/minus button.
* **Edit the cells.** Cells are in math mode as default, but one can toggle between math mode and text mode with **$ (dollar)** key.
* **Move** between cells:
** **Up** and **down** arrows go up and down respectively.
** **Left** and **right** arrows together with *ctrl-key* or *alt-key* (or *command* in Mac) move the focus to the cell on the left or right respectively.
** **Enter** moves the focus downwards to the next cell.
** **Tabulator** key moves the focus to the next cell (left to right, top to bottom) and shift+tab to the previous cell.
** **Esc**-key loses the focus from the cell.
