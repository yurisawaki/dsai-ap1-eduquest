import { porta } from './config'
import { criarApp } from './app'

const app = criarApp()

app.listen(porta, () => {
  console.log(`EduQuest em http://localhost:${porta}`)
})
