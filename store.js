const fs = require('fs')

class Store {
  constructor () {
    let store
    const initStore = { weather: {}, session: {} }
    this.storePath = '/data/store.json'
    if (fs.existsSync(this.storePath)) {
      try {
        store = JSON.parse(fs.readFileSync(this.storePath, 'utf8'))
      } catch (err) {
        console.error('failed to parse store: ', err)
        store = initStore
      }
      store.session = {}
      fs.access(this.storePath, fs.constants.W_OK, err => {
        if (err) {
          console.error(`cannot write lockfile ${this.storePath}, permission denied`)
          process.exit(1)
        }
      })
      this.state = store
    } else {
      store = initStore
      this.state = store
      this.save()
    }
  }

  save () {
    const copied = JSON.parse(JSON.stringify(this.state))
    delete copied.session
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(copied))
    } catch (err) {
      console.error(`cannot write lockfile ${this.storePath}, permission denied`)
      process.exit(1)
    }
  }
}

const store = new Store()

module.exports = store
