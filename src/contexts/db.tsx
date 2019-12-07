import * as React from 'react';

type ContextProps = { 
    dbFeeds?: PouchDB.Database<any>;
    dbFeedsItems?: PouchDB.Database<any>;
};

export const DbContext = React.createContext<ContextProps>({
    dbFeeds:       undefined,
    dbFeedsItems:  undefined,
});

type ProviderProps = {
    db: {
        dbFeeds: PouchDB.Database<any>;
        dbFeedsItems: PouchDB.Database<any>;
    };
}

export const DbProvider: React.FunctionComponent<ProviderProps> = ({db, children}) => {
    
    return (
        <DbContext.Provider value={db}>
            {children}
        </DbContext.Provider>
    )
}

export const useDb = () => React.useContext(DbContext);