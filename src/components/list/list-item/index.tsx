import * as React from 'react'
import moment from 'moment'
import { Item } from '../../../store/reader-store'

import "./index.scss"

type ListItemProps = {
    item: Item;
    onItemClick: (item: Item) => void;
}
const ListItem: React.FunctionComponent<ListItemProps> = ({ item, onItemClick }) => {

    const handleItemClick = (e: React.MouseEvent<HTMLAnchorElement>): void => {
        e.preventDefault();
        onItemClick(item)
    }

    return (
        <a key={item.id} href={item.link} onClick={handleItemClick} target="_blank" rel="noopener noreferrer">
            <li className={item.unread ? 'unread' : ''}>
                <div className="i"><img alt="icon" src={item.icon} /></div>
                <div className="ts">{moment(item.date).fromNow(true)}</div>
                <div className="t">{(item.title && item.title.substring) ? item.title.substring(0, 150) : ''}</div>
                <div className="d">{(item.desc && item.desc.substring) ? item.desc.substring(0, 180) : ''}...</div>
            </li>
        </a>
    );
}
export default ListItem