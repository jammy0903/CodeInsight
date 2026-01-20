
import os
import sys
import json
from typing import Dict

# In a real scenario, this would use the Gemini API.
# For this simulation, we will use a placeholder function.
# The `prompt` argument contains the master prompt with all the project context.
def call_generative_ai(prompt: str) -> Dict[str, str]:
    """
    Simulates a call to a generative AI model.
    In a real implementation, this would make an API request to a model like Gemini
    and would not have a hardcoded response.
    """
    print("--------------------------------")
    print("🤖 AI is thinking... (Simulated Call)")
    print("--------------------------------")
    # This is a hardcoded response for the example "a round share button with an icon".
    # A real model would generate this dynamically based on the user's prompt.
    mock_response = {
        "componentCode": """
import React from 'react';
import { Share2 } from 'lucide-react';

export interface ShareButtonProps {
  /**
   * The size of the button.
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

/**
 * A round button with a share icon, designed with Tailwind CSS.
 */
export const ShareButton = ({
  size = 'medium',
  onClick,
  ...props
}: ShareButtonProps) => {
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  const iconSizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-7 h-7',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded-full
        bg-primary hover:bg-primary-hover
        text-primary-foreground
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring
        transition-all duration-200 ease-in-out
        shadow-card hover:shadow-card-hover
        ${sizeClasses[size]}
      `}
      {...props}
    >
      <Share2 className={iconSizeClasses[size]} />
      <span className="sr-only">Share</span>
    </button>
  );
};
""",
        "storyCode": """
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { ShareButton } from '../components/ShareButton';

const meta = {
  title: 'Components/ShareButton',
  component: ShareButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof ShareButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {
  args: {
    size: 'medium',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
  },
};
"""
    }
    return mock_response

def build_master_prompt(user_prompt: str, component_name: str) -> str:
    # In a real implementation, these examples would be read from the files.
    # For simplicity, they are included as strings here.
    component_example = """
import React from 'react';

export interface GoodButtonProps {
  /** Is this the principal call to action on the page? */
  primary?: boolean;
  /** How large should the button be? */
  size?: 'small' | 'medium' | 'large';
  /** Button contents */
  label: string;
  /** Optional click handler */
  onClick?: () => void;
}

/** Primary UI component for user interaction */
export const GoodButton = ({
  primary = false,
  size = 'medium',
  label,
  ...props
}: GoodButtonProps) => {
  const baseClasses = 'font-bold py-2 px-4 rounded';
  const sizeClasses = size === 'large' ? 'text-lg' : size === 'small' ? 'text-sm' : 'text-base';
  const modeClasses = primary ? 'bg-blue-500 hover:bg-blue-700 text-white' : 'bg-gray-500 hover:bg-gray-700 text-white';

  return (
    <button
      type="button"
      className={`${baseClasses} ${sizeClasses} ${modeClasses}`}
      {...props}
    >
      {label}
    </button>
  );
};
"""

    story_example = """
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GoodButton } from './GoodButton';

const meta = {
  title: 'Example/GoodButton',
  component: GoodButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof GoodButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    primary: true,
    label: 'Button',
  },
};
"""

    master_prompt = f"""
As an expert React developer, your task is to create a new component for a codebase that uses React, TypeScript, and Tailwind CSS.
The component should be named `{component_name}`.

**USER'S REQUEST:**
"{user_prompt}"

**PROJECT CONTEXT & RULES:**

1.  **Styling:**
    *   Use **Tailwind CSS utility classes** for all styling. Do NOT create or import a separate `.css` file.
    *   The project has a detailed theme in `tailwind.config.js`. You can and should use custom theme classes like `bg-primary`, `text-neon-cyan`, `shadow-card`, etc.
    *   The project uses `lucide-react` for icons. If an icon is needed, import it from `lucide-react`.

2.  **Component Structure:**
    *   Create a functional component using TypeScript.
    *   Define props in a TypeScript interface named `{component_name}Props`.
    *   Document each prop clearly using JSDoc comments.
    *   Use a named export: `export const {component_name} = ...`
    *   Follow this general component structure:
    ```typescript
    {component_example}
    ```

3.  **Storybook Story Structure:**
    *   Create a corresponding Storybook story file.
    *   The story file should be placed in `src/stories/` and the component in `src/components/`.
    *   Use `Meta` and `StoryObj` types from `@storybook/react-vite`.
    *   Use `satisfies Meta<...>` for type safety.
    *   Create at least a default story and other relevant variants based on the component's props.
    *   Follow this general story structure:
    ```typescript
    {story_example}
    ```

**OUTPUT FORMAT:**
Provide your response as a single JSON object with two keys: "componentCode" and "storyCode". The value for each key should be a string containing the complete code for the respective file. Do not include any other explanations or markdown formatting.
"""
    return master_prompt

def main():
    if len(sys.argv) < 3:
        print("Usage: python component-generator.py <ComponentName> \"<user prompt>\"")
        sys.exit(1)

    component_name = sys.argv[1]
    user_prompt = sys.argv[2]
    
    # Define paths
    # Note: This script is run from the project root.
    component_path = os.path.join("packages", "frontend", "src", "components", f"{{component_name}}.tsx")
    story_path = os.path.join("packages", "frontend", "src", "stories", f"{{component_name}}.stories.tsx")

    print(f"OK. I will generate the '{{component_name}}' component based on your request: '{{user_prompt}}'")
    print(f"Component will be saved to: {{component_path}}")
    print(f"Story will be saved to: {{story_path}}")

    # Build the prompt
    master_prompt = build_master_prompt(user_prompt, component_name)

    # Call the AI to get the code
    generated_code = call_generative_ai(master_prompt)

    # Create directories if they don't exist
    os.makedirs(os.path.dirname(component_path), exist_ok=True)
    os.makedirs(os.path.dirname(story_path), exist_ok=True)

    # Write the files
    try:
        with open(component_path, "w") as f:
            f.write(generated_code["componentCode"].strip())
        print(f"✅ Successfully wrote component to {{component_path}}")

        with open(story_path, "w") as f:
            f.write(generated_code["storyCode"].strip())
        print(f"✅ Successfully wrote story to {{story_path}}")
        
        print("\n🎉 All done! You can now run Storybook to see your new component.")

    except Exception as e:
        print(f"❌ An error occurred while writing files: {{e}}")
        sys.exit(1)

if __name__ == "__main__":
    main()
