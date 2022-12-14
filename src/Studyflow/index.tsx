import React from 'react'
import Placeholder from './Placeholder'
import { Plus } from '@styled-icons/fa-solid/Plus'
import List from './List'
import Form from 'Studyflow/Form'
import { StudyFlowType } from 'Studyflow/types'
import useRecords from 'utils/useRecords'
import api from 'api'

type Props = {
  showMenu: boolean
  toggleMenu(): void
}

export default function Notebook({ toggleMenu }: Props) {
  const { data } = useRecords({
    key: ['studyFlow'],
    load: api.studyFlow.list,
  })
  const [addType, setAddType] = React.useState<StudyFlowType>()

  const addConversation = () => {
    toggleMenu()
    setAddType('conversation')
  }

  const addRepetition = () => {
    toggleMenu()
    setAddType('repetition')
  }

  const closeForm = () => {
    toggleMenu()
    setAddType(undefined)
  }

  if (addType) return <Form type={addType} onClose={closeForm} />

  return (
    <>
      <div className="flex-center flex-shrink-0 p-3 border-b border-gray-c5">
        <button
          style={{ width: '160px', height: '30px' }}
          type="button"
          className="bg-gray-5b text-white rounded-full text-sm uppercase flex-center"
          onClick={addConversation}
        >
          <Plus className="mr-2" size={18} />
          Conversation
        </button>
        <button
          style={{ width: '160px', height: '30px' }}
          type="button"
          className="bg-gray-5b text-white rounded-full text-sm uppercase flex-center ml-5"
          onClick={addRepetition}
        >
          <Plus className="mr-2" size={18} />
          Repetition
        </button>
      </div>
      {data && data.pages.length === 0 && <Placeholder />}
      <div className="flex-grow flex flex-1 min-h-0">
        {data &&
          data.pages.length > 0 &&
          data.pages.map((page, i) => <List key={i} items={page} />)}
      </div>
    </>
  )
}
