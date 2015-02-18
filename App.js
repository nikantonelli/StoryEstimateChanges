Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:[
        {
            xtype: 'container',
            id: 'selectbox'
        },
        {
            xtype: 'container',
            id: 'htmlbox'
        }
    ],

    _update: function(app) {

        var data = this.usStore.data.items;

        if (data.length === 0)
        {
            app.setMsg(app, app.noDataMsg);
            return;
        }

        var storyId = data[0].get('FormattedID');
        var currentEstimate = data[0].get('PlanEstimate');
        var deltas = false;

        _.each(data, function(record) {
            if ( record.get('FormattedID') !== storyId)
            {
                storyId = record.get('FormattedID');
                currentEstimate = record.get('PlanEstimate');
            }
            else if ( record.get('PlanEstimate') !== currentEstimate){
                if (currentEstimate !== 0){
                    deltas = true;
                    Ext.getCmp('htmlbox').add(
                        {
                            xtype: 'component',
                            html: record.get('FormattedID') + ' changed from ' + currentEstimate + ' to ' + record.get('PlanEstimate') + ' at ' + record.get('_ValidFrom')
                        }
                    );
                }
                currentEstimate = record.get('PlanEstimate');
            }
        });
        if (deltas === false){
            Ext.getCmp('htmlbox').add(app.noDeltaMsg);
        }
    },

    usStore: null,

    usStoreConfig: function(app){

    console.log(this.getContext());

        return {

            context: this.getContext().getDataContext(),
            autoLoad: false,
            id: 'usStore',
            fetch: ['FormattedID', 'Name', 'PlanEstimate', 'Iteration'],
            hydrate: ['FormattedID', 'Name', 'PlanEstimate', 'Iteration' ],
            filters:  [
                        {
                            property: '_TypeHierarchy',
                            operator: '$in',
                            value: [ 'HierarchicalRequirement', 'Defect' ]
                        },
                        {
                            property: 'Iteration',
                            value: Rally.util.Ref.getOidFromRef( Ext.getCmp('selectIteration').value)
                        }
            ]

        };
    },

    loadingMsg: {
                xtype: 'component',
                html: 'Loading data....'
    },

    noDataMsg: {
                xtype: 'component',
                html: 'No data found'
    },

    noDeltaMsg: {
                xtype: 'component',
                html: 'no deltas found'
    },

    setMsg: function(app, msg) {
        Ext.getCmp('htmlbox').removeAll();
        Ext.getCmp('htmlbox').add( msg );
    },

    launch: function() {

        var app = this;

        app.setMsg(app, app.loadingMsg);

        var iterationSelector = Ext.create( 'Rally.ui.combobox.IterationComboBox', {
            id: 'selectIteration',
            margin: 10
        });

        Ext.getCmp('selectbox').add(iterationSelector);

        app.usStore = Ext.create('Rally.data.lookback.SnapshotStore',  app.usStoreConfig(app) );

        iterationSelector.on( {
            ready: function() {
                app.usStore.load({
                    callback: function(records, operation, success) {
                        app._update(app);
                    }
                });
            },
            select: function() {
                Ext.getCmp('htmlbox').removeAll();
                app.setMsg(app, app.loadingMsg);
                app.usStore = Ext.create('Rally.data.lookback.SnapshotStore', app.usStoreConfig(app) );
                app.usStore.load({
                    callback: function(records, operation, success) {
                        app._update(app);
                    }
                });
            }

        });

Ext.util.Observable.capture( iterationSelector, function(event) {
    console.log(iterationSelector.id, event, arguments);
});


    }
});
