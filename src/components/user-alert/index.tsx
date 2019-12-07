import * as React from 'react';
import './index.less';

export type UserAlertProps = {
    triggerOK: () => void;
}
// NewUserAlert
// Onboarding
// Provide help by adding first feed link
const UserAlert: React.FunctionComponent<UserAlertProps> = ({ triggerOK }) => (
    <div className="App-Alert">
        <div className="App-Alert-Title">Seems like you are new here ?</div>
        <div className="App-Alert-Content">Let me help you by adding new contents for you :-)</div>
        <div className="App-Alert-Actions">
            <button onClick={triggerOK}>OK</button>
        </div>
    </div>
);

export default UserAlert