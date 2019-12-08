/* eslint-disable @typescript-eslint/explicit-function-return-type */
const appStore = () => ({
    darkMode: false,
    hideFeeds: false, // mobile
    toggleDarkMode(toggle?: boolean): void {
        this.darkMode = toggle ? toggle : !this.darkMode
    },
    toggleHideFeeds(toggle?: boolean): void {
        this.hideFeeds = toggle ? toggle : !this.hideFeeds
    },
});


export default appStore;
