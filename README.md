# Bookshelf Soft Delete
This plugin works with Bookshelf.js, available here http://bookshelfjs.org, in
order to introduce a soft deletion. What this means is that items will appear
deleted to an end user, but will not in fact be removed from the database.

## Installation
  
    npm install bookshelf-softdelete

Then in your bookshelf configuration:

    var Bookshelf = require('bookshelf')(knexconf);
    Bookshelf.plugin(require('bookshelf-softdelete'));

## Usage

On your bookshelf Model which you would like to mark for soft deletion mention the field name:

    soft: 'FIELD_NAME' 

Please note that this will set 0(default) or 1(deleted). You can explicity specify the deleted value. It can be a number or string 

    soft: {
        'field': 'FIELD_NAME',
        'val': {'normal': 1, 'deleted': 0}
    },

If you wish to disable soft delete for a given operation, e.g., `fetch`, simply
pass an object with `softDelete: false` to that operation.

    YourModel.where("id", searchId)
        .fetch({softDelete: false})

If you need to restore something which has been soft deleted, `model.restore`
will do this.

### Usage with a custom initialize function

This package has an initialize function that wires everthing up. If you declare a custom initialize function, you need to make sure to call the initialize function on the prototype from the custom initialize function in order for everything to work properly.

    var repository = require('./repo');

    module.exports = repository.Model.extend({
      tableName: 'users',
      soft: 'is_valid',

      initialize: function() {
        this.on('saving', this.validate);
        repository.Model.prototype.initialize.apply(this, arguments);
      },

      validate: function() {
        ...
      }
    });



### Credits
This is based on https://github.com/lanetix/node-bookshelf-soft-delete.git
