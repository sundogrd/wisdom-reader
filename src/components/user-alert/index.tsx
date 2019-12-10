import * as React from 'react';
import './index.less';

export type UserAlertProps = {
    triggerOK: () => void;
}
// NewUserAlert
// Onboarding
// Provide help by adding first feed link
const UserAlert: React.FunctionComponent<UserAlertProps> = ({ triggerOK }) => (
    <div className="app-alert">
        <div className="app-alert-title">Seems like you are new here ?</div>
        <div className="app-alert-content">Let me help you by adding new contents for you :-)</div>
        <div className="app-alert-actions">
            <button onClick={triggerOK}>OK</button>
        </div>
    </div>
);

export default UserAlert