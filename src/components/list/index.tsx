import * as React from 'react'
import * as ReactUse from 'react-use'
import classnames from 'classnames'
import * as _ from 'lodash'
import { observer } from 'mobx-react'
import { Item } from '../../store/reader-store'
import { StarFullIcon, LightIcon } from '../icon'
import useMobxStores from '../../hooks/use-mobx-stores'
import { TStore } from '../../store'
import ListItem from './list-item'

import "./index.scss"

type ListProps = {
}
const List: React.FunctionComponent<ListProps> = observer(({ }) => {
    const { readerStore, appStore } = useMobxStores<TStore>()
    const [showItemList, setShowItemList] = React.useState([] as Array<Item>)

    const [favoriteSwitch, toggleFavoriteSwitch] = ReactUse.useToggle(false)
    const [loading, toggleLoading] = ReactUse.useToggle(true)

    React.useEffect(() => {
        if (readerStore.inited) {
            toggleLoading(false)
            setShowItemList(readerStore.items)
        }
    }, [readerStore.inited])

    React.useEffect(() => {
        if (favoriteSwitch) {
            setShowItemList(readerStore.items.filter((item) => item.favorite))
        } else {
            setShowItemList(readerStore.items)
        }
    }, [readerStore.items])

    // const handleMarkAllButtonClick = () => {
    //     readerStore.markItemsAsRead([])
    // }

    const emptyView = (
        <div className="app-list-empty">
            <h1>(o_O)</h1>
            <p>There is nothing to read right now..</p>
        </div>
    );
    // const markAsReadButton = (
    //     <div className="app-list-mark-as-read-button" onClick={handleMarkAllButtonClick}>
    //         <p>MARK ALL AS READ</p>
    //     </div>
    // );

    const handleFavoriteSwitchClick = async () => {
        if (loading === true) return;
        toggleLoading(true)
        toggleFavoriteSwitch()
        const newFavoriteSwitch = !favoriteSwitch

        if (newFavoriteSwitch) {
            const items = await readerStore.items.filter((item) => item.favorite)
            setShowItemList(items)
        } else {
            const items = await readerStore.items
            setShowItemList(items)
        }
        
        toggleLoading(false)
    }

    const handleDarkModeSwitchClick = () => {
        appStore.toggleDarkMode()
    }

    const handleItemClick = (item: Item): void => {
        readerStore.read(item)

        try {
            readerStore.markItemsAsRead([item.id])
        } catch(e) {
            // console.warn(`Unable to mark as read item: ${item.id} reason: ${e}`);
        }
    }

    const handleShowFeedsClick = (): void => {
        appStore.toggleHideFeeds()
    }

    //Order by date DESC
    const orderedItems = _.sortBy(showItemList, (item) => (-item.date), (item) => (item.unread));

    // //Unread items
    // const unreadItems  = this.state.items.filter(item => item.unread === true);

    const renderLoadingView = () => (
        <div className="app-list-empty">
            <p>loading...</p>
        </div>
    );
    return (
        <div className="app-list">
            <div className="app-list-options">
                <button onClick={handleShowFeedsClick} className="app-list-options-open-feeds">Feeds</button>
                <button onClick={handleFavoriteSwitchClick} title="Show only favorites" className={classnames({'active': favoriteSwitch})}>
                    <StarFullIcon />
                </button>
                <button onClick={handleDarkModeSwitchClick} title="Switch to dark mode" className={classnames({'active': appStore.darkMode})}>
                    <LightIcon />
                </button>
            </div>
            <ul>
                {orderedItems.map((item) => (
                    <ListItem key={item.id} item={item} onItemClick={handleItemClick} />
                ))}
            </ul>

            {(loading === true) && renderLoadingView()}
            {(loading === false && orderedItems.length === 0) && emptyView}
        </div>
    );
})
export default List