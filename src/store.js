const fs = require('fs')

class Store {
  constructor () {
    let store
    const initStore = { weather: {}, weatherPush: {}, notification: {}, pushedWeatherMsg: {}, session: {}, userBotContext: {} }
    this.storePath = '/data/store.json'
    if (fs.existsSync(this.storePath)) {
      try {
        store = JSON.parse(fs.readFileSync(this.storePath, 'utf8'))
      } catch (err) {
        console.error('failed to parse store: ', err)
        store = initStore
      }
      if (!store.notification) store.notification = {} // update migration
      if (!store.session) store.session = {} // update migration
      if (!store.weatherPush) store.weatherPush = {} // update migration
      if (!store.pushedWeatherMsg) store.pushedWeatherMsg = {} // update migration
      if (!store.userBotContext) store.userBotContext = {} // update migration
      try {
        fs.accessSync(this.storePath, fs.constants.W_OK)
      } catch (err) {
        console.error(`cannot write lockfile ${this.storePath}, permission denied`)
        process.exit(1)
      }
      this.state = store
    } else {
      store = initStore
      this.state = store
      this.saveSync()
    }
  }

  saveSync () {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.state))
    } catch (err) {
      console.error(`cannot write lockfile ${this.storePath}, permission denied`)
      process.exit(1)
    }
  }

  async save () {
    try {
      await fs.promises.writeFile(this.storePath, JSON.stringify(this.state))
    } catch (err) {
      console.error(`cannot write lockfile ${this.storePath}, permission denied`)
      process.exit(1)
    }
  }
}

const store = new Store()

module.exports = store
