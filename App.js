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

    _reload: function(app) {

        if (app.usStore) {
            app.usStore.destroy();

        }

        app.usStore = Ext.create(' Rally.data.wsapi.Store', {
            
        });

//        app.usStore = Ext.create('Rally.data.lookback.SnapshotStore',  app.usStoreConfig(app) );
        app.usStore.load({
            callback: function(records, operation, success) {
                if (records.length === 0){
                    app.setMsg(app, app.noDataMsg);
                    return;
                };
                if (app._useTasks()){
                    app._getTasks(app);
                }
                else {
                    app._update(app);
                }
            }
        });

    },

    // The usStore has the records, we need to get the list of Oids to pass into the filter
    _getTasks: function(app){

        var storyList = [];
        _.each(app.usStore.data.items, function(item) {
            storyList.push( item.get('ObjectID'));
        });
debugger;

    },

    _useTasks: function() {
        return Ext.getCmp('selectType') && Ext.getCmp('selectType').value;
    },

    _update: function(app) {

        var data = this.usStore.data.items;

        if (data.length === 0)
        {
            app.setMsg(app, app.noDataMsg);
            return;
        }

        var storyId = data[0].get('FormattedID');

        var fieldToGet = 'PlanEstimate';
        if (this._useTasks()) fieldToGet = 'Estimate';

        var currentEstimate = data[0].get([fieldToGet]);
        var deltas = false;

        _.each(data, function(record) {
            if ( record.get('FormattedID') !== storyId)
            {
                storyId = record.get('FormattedID');
                currentEstimate = record.get([fieldToGet]);
            }
            else if ( record.get([fieldToGet]) !== currentEstimate){
                if (currentEstimate !== 0){
                    deltas = true;
                    Ext.getCmp('htmlbox').add(
                        {
                            xtype: 'component',
                            html: record.get('FormattedID') + ' changed from ' + currentEstimate + ' to ' + record.get([fieldToGet]) + ' at ' + record.get('_ValidFrom')
                        }
                    );
                }
                currentEstimate = record.get([fieldToGet]);
            }
        });
        if (deltas === false){
            Ext.getCmp('htmlbox').removeAll();
            Ext.getCmp('htmlbox').add(app.noDeltaMsg);
        }
    },

//[17686328359,-51009,10486554921]

    usStore: null,

    usStoreConfig: function(app){

        console.log(this.getContext().getDataContext());

//        var typeList = app._useTasks() ? [ 'Task' ] :  [ 'HierarchicalRequirement', 'Defect' ];
        var typeList = [ 'HierarchicalRequirement', 'Defect' ];

        return {

//            context: this.getContext().getDataContext(), // This is ignored by the LBAPI
//                                                         // Added extra filter below
            autoLoad: false,
            id: 'usStore',
            fetch: ['FormattedID', 'Name', 'PlanEstimate', 'Estimate', 'Iteration'],
            hydrate: [ 'Iteration' ],
            filters:  [
//                        {
//                            property: '_ItemHierarchy',
//                            operator: '$in',
//                            value: app.storyList
//                        },
                        {
                            property: '_TypeHierarchy',
                            operator: '$in',
                            value: typeList
                        },
                        {
                            property: 'Iteration',
                            value: Rally.util.Ref.getOidFromRef( Ext.getCmp('selectIteration').value)
                        },
                        {
                            property: '_ProjectHierarchy',
                            value: Rally.util.Ref.getOidFromRef(this.getContext().getProject())
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
                app._reload(app)
            },
            select: function() {
                Ext.getCmp('htmlbox').removeAll();
                app.setMsg(app, app.loadingMsg);
                app._reload(app)
            }

        });

        var typeSelector = Ext.create( 'Rally.ui.CheckboxField', {
            fieldLabel: "Use Tasks",
            value: false,
            id: 'selectType',
            listeners: {
                change: function() { app._reload(app) }
            }
        });

        Ext.getCmp('selectbox').add(typeSelector);

Ext.util.Observable.capture( iterationSelector, function(event) {
    console.log(iterationSelector.id, event, arguments);
});
Ext.util.Observable.capture( typeSelector, function(event) {
    console.log(iterationSelector.id, event, arguments);
});


    }
});
