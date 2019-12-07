import * as React from 'react'
import * as ReactUse from 'react-use'

type ListProps = {
    items: Array<any>;
    openViewer: (item: any) => void;
}
const List: React.FunctionComponent<ListProps> = ({ items }) => {
    return (
        <div>
            list
        </div>
    )
}
export default List