import * as React from 'react';
import { MobXProviderContext } from 'mobx-react';

function useMobxStores<T>(): T {
    return React.useContext(MobXProviderContext);
}

export default useMobxStores;
