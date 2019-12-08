import * as React from 'react';
import * as ReactUse from 'react-use'
import { Provider, useLocalStore , observer } from 'mobx-react';
import classnames from 'classnames'
import Feeds from './components/feeds';
import {createStore, TStore} from './store/index'
import List from './components/list';
import Viewer from './components/viewer';

import './App.scss';

const App: React.FunctionComponent = observer(() => {
    // const [loading, toggleLoading] = ReactUse.useToggle(true)
    // const [viewer, setViewer] = React.useState(null)
  
    const store = useLocalStore<TStore>(createStore)

    ReactUse.useMount(async () => {
        await store.readerStore.init()
    })

    // const handleOpenViewer = (item: any): void => {
    //     window.location.hash = "#viewer";
    //     setViewer(item);
    // }
    
    // const handleViewerBack = (): void => {
    //     return 
    // }

    return (
        <div className={classnames("App", {"dark": store.appStore.darkMode})}>
            <Provider {...store}>
                <Feeds />
                <List />
                <Viewer />
            </Provider>
        </div>
    );
})

export default App;
