import React from 'react'
import { observer } from 'mobx-react-lite'

type EditorRef = { current: HTMLDivElement | null }

const TextArea = React.memo(
  ({
    editorRef,
    getValue,
    setValue,
    onFocus,
    onBlur,
  }: {
    editorRef: EditorRef
    getValue(): string
    setValue(value: string): void
    onFocus(): void
    onBlur(): void
  }) => {
    return (
      <div
        ref={editorRef}
        contentEditable
        className="focus:outline-none w-full js-editor whitespace-pre-wrap"
        style={{ minHeight: '170px' }}
        onFocus={onFocus}
        onBlur={onBlur}
        dangerouslySetInnerHTML={{ __html: getValue() }}
        onInput={(e) => {
          setValue((e.target as HTMLElement).innerHTML)
        }}
        onPaste={(e: any) => {
          e.preventDefault()
          const text = (e.originalEvent || e).clipboardData.getData(
            'text/plain',
          )
          document.execCommand('insertHTML', false, text)
          setValue((e.target as HTMLElement).innerHTML)
        }}
      />
    )
  },
)

type Props = {
  editorRef: EditorRef
  getValue(): string
  setValue(value: string): void
}

export default observer(function FormTextarea({
  editorRef,
  getValue,
  setValue,
}: Props) {
  const [focused, setFocused] = React.useState(false)

  const onFocus = React.useCallback(() => {
    setFocused(true)
  }, [])

  const onBlur = React.useCallback(() => {
    setFocused(false)
  }, [])

  const fixedGetValue = React.useCallback(getValue, [])
  const fixedSetValue = React.useCallback(setValue, [])

  return (
    <div className="mt-7 mb-4 text-lg block relative">
      {!focused && getValue().length === 0 && (
        <div className="text-gray-6b pointer-events-none absolute top-0 left-0">
          Post anything about English learning.
        </div>
      )}
      <TextArea
        getValue={fixedGetValue}
        setValue={fixedSetValue}
        editorRef={editorRef}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  )
})
