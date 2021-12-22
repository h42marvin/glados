import TextEditorUtils from '../TextEditorUtils';

const { StorageType } = TextEditorUtils;

const typeToValue = {
    [StorageType.MARKDOWN]: 'markdown:Normal [Kasturi](mention:log-topic:3) [Link](facebook.com) Text\n\n# Heading 1\n\n#### Heading 4\n\n```\nCode\n```\n\n> Quote\n\n- List Item 1\n- List Item 2',
    [StorageType.DRAFTJS]: 'draftjs:{"blocks":[{"key":"3f9if","text":"Normal Kasturi Link Text","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[{"offset":7,"length":7,"key":0},{"offset":15,"length":4,"key":1}],"data":{}},{"key":"c8ie","text":"Heading 1","type":"header-one","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"eq8v6","text":"Heading 4","type":"header-four","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"b674h","text":"Code","type":"code-block","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"12dll","text":"Quote","type":"blockquote","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"288di","text":"List Item 1","type":"unordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"3hmqp","text":"List Item 2","type":"unordered-list-item","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{"0":{"type":"mention","mutability":"SEGMENTED","data":{"mention":{"__type__":"log-topic","id":3}}},"1":{"type":"LINK","mutability":"MUTABLE","data":{"url":"facebook.com"}}}}',
};

function verify(inputType, outputType) {
    const expectedValue = typeToValue[outputType];
    const actualValue = TextEditorUtils.serialize(
        TextEditorUtils.deserialize(typeToValue[inputType], inputType),
        outputType,
    );
    if (outputType === StorageType.DRAFTJS) {
        const value1 = TextEditorUtils.deserialize(expectedValue, StorageType.DRAFTJS);
        const value2 = TextEditorUtils.deserialize(actualValue, StorageType.DRAFTJS);
        expect(TextEditorUtils.equals(value1, value2)).toBeTruthy();
    } else {
        expect(actualValue).toEqual(expectedValue);
    }
}

test('test_storage_type_conversion', () => {
    verify(StorageType.MARKDOWN, StorageType.MARKDOWN);
    verify(StorageType.MARKDOWN, StorageType.DRAFTJS);
    verify(StorageType.DRAFTJS, StorageType.MARKDOWN);
    verify(StorageType.DRAFTJS, StorageType.DRAFTJS);
});
