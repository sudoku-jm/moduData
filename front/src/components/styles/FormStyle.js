import styled from "styled-components";

export const FormStyle = styled.div`
    ${({ $type }) => {
        let styles = "";

        // $type에 따른 스타일 조건을 추가할 수 있습니다.
        if ($type == "inpectionDetail") {
            styles += `
                text-align:left;
                & > h4{
                    margin: 10px 0;
                }
                form > div{
                    margin:4px 2px;
                    width:calc(50% - 10px);
                  
                }
                .fromTo {
                    & > div{
                        vertical-align:middle;
                    }
                    & > div:first-child{
                        margin:4px 2px 4px 0;
                    }
                    & > div:last-child{
                        margin:4px 0 4px 2px;
                    }
                }
                .dynamicForm{
                    width:100%;
                    & > div{
                         display: flex;
                         align-items: center;
                        margin-bottom: 8px;
                        & > div{
                          margin-right:2px;
                          width:calc(50% - 10px);
                        }
                    }
                    button{
                        min-width: 30px;
                        padding: 6px 0;
                        line-height: 1;
                        font-size: 14px;
                    }
                }
          `;
        }

        return styles;
    }}
`;
