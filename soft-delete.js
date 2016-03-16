function shouldDisable(opts) {
    return opts && opts.hasOwnProperty('softDelete') && !opts.softDelete;
}

function addDeletionCheck(softField) {
    var deletedField = softField;

    /*eslint-disable no-underscore-dangle*/
    if (this._knex) {
        var table = this._knex._single.table;
        /*eslint-enable no-underscore-dangle*/
        deletedField = table + '.' + softField;
    }

    this.query(function(qb) {
        qb.where(function() {
            var query = this.where({
                deletedField : 0
            });
        });
    });
}

module.exports = function(Bookshelf) {

    var mProto = Bookshelf.Model.prototype,
        cProto = Bookshelf.Collection.prototype;

    Bookshelf.Model = Bookshelf.Model.extend({

        initialize: function() {
            return mProto.initialize.apply(this, arguments);
        },

        fetch: function(opts) {
            if (this.soft && !shouldDisable(opts)) {
                addDeletionCheck.call(this, this.soft);
            }
            return mProto.fetch.apply(this, arguments);
        },

        restore: function() {
            if (this.soft) {
                this.set(this.soft, 0);
                return this.save();
            } else {
                throw new TypeError('restore can not be used if the model does not ' +
                    'have soft delete enabled');
            }
        },

        destroy: function(opts) {
            if (this.soft && !shouldDisable(opts)) {
                var model = this;
                var softField = model.soft;
                return model.triggerThen('destroying', model, opts)
                    .then(function() {
                        model.set(softField, 1);
                        return model.save();
                    })
                    .then(function() {
                        return model.triggerThen('destroyed', model, undefined, opts);
                    });
            } else {
                return mProto.destroy.apply(this, arguments);
            }
        }
    });

    Bookshelf.Collection = Bookshelf.Collection.extend({
        fetch: function(opts) {
            var modelOpts = {};

            if (modelOpts.soft && !shouldDisable(opts)) {
                addDeletionCheck.call(this, modelOpts.soft);
            }
            return cProto.fetch.apply(this, arguments);
        },

        count: function(field, opts) {
            opts = opts || field;

            var modelOpts = {};

            if (modelOpts.soft && !shouldDisable(opts)) {
                addDeletionCheck.call(this, modelOpts.soft);
            }

            return cProto.count.apply(this, arguments);
        }
    });
};
