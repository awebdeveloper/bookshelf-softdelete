function shouldDisable(opts) {
    return opts && opts.hasOwnProperty('softDelete') && !opts.softDelete;
}

function addDeletionCheck(softField) {
    var deletedField = softField.field;
    var defaultValue = softField.val.normal;

    /*eslint-disable no-underscore-dangle*/
    if (this._knex) {
        var table = this._knex._single.table;
        /*eslint-enable no-underscore-dangle*/
        deletedField = table + '.' + deletedField;
    }

    var whereClause = {};
    whereClause[deletedField] = defaultValue;

    this.query(function(qb) {
        console.log(qb);
        qb.where(function() {
            var query = this.andWhere(whereClause);
        });
    });
}

function setSoftDeleteOptions(soft) {
    if (typeof soft === "string") {
        this.softField = {
            field: soft,
            val: {
                normal: 0,
                deleted:1
            }
        };
    } else {
        this.softField = soft || false;
    }
}

module.exports = function(Bookshelf) {

    var mProto = Bookshelf.Model.prototype,
        cProto = Bookshelf.Collection.prototype;


    Bookshelf.Model = Bookshelf.Model.extend({

        initialize: function() {
            setSoftDeleteOptions.call(this, this.soft);
            return mProto.initialize.apply(this, arguments);
        },

        fetch: function(opts) {
            if (this.softField && !shouldDisable(opts)) {
                addDeletionCheck.call(this, this.softField);
            }
            return mProto.fetch.apply(this, arguments);
        },
        fetchAll: function(opts) {
            if (this.softField && !shouldDisable(opts)) {
                addDeletionCheck.call(this, this.softField);
            }
            return mProto.fetchAll.apply(this, arguments);
        },

        restore: function() {
            if (this.softField) {
                var softField = this.softField.field;
                var normalVal = this.softField.val.normal;
                this.set(softField, normalVal);
                return this.save();
            } else {
                throw new TypeError('restore can not be used if the model does not ' +
                    'have soft delete enabled');
            }
        },

        destroy: function(opts) {
            if (this.softField && !shouldDisable(opts)) {
                var model = this;
                var softField  = model.softField.field;
                var deletedVal = model.softField.val.deleted;
                return model.triggerThen('destroying', model, opts)
                    .then(function() {
                        model.set(softField, deletedVal);
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
            setSoftDeleteOptions.call(modelOpts, this.model.prototype.soft);

            if (modelOpts.softField && !shouldDisable(opts)) {
                addDeletionCheck.call(this, modelOpts.softField);
            }
            return cProto.fetch.apply(this, arguments);
        },

        count: function(field, opts) {
            opts = opts || field;

            var modelOpts = {};
            setSoftDeleteOptions.call(modelOpts, this.model.prototype.soft);

            if (modelOpts.softField && !shouldDisable(opts)) {
                addDeletionCheck.call(this, modelOpts.softField);
            }

            return cProto.count.apply(this, arguments);
        }
    });
};
