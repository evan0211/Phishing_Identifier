import { reactive } from 'vue'

export const resultState = reactive({
  data:      null,
  lastInput: '',
  lastType:  'url',
})
