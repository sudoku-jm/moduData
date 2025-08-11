import styled from "styled-components";

export const CheckboxForm = styled.span`
    ${({ $checked }) => {
        return `
            font-size: 13px;
            display: flex;

            label {
                display: flex;
                align-items: center;
                color: ${$checked ? "#1976d2" : "black"};
            }

            input[type="checkbox"] {
                width: 14px;
                margin-right: 6px;
                align-items: center;
            }
        `;
    }}
`;
