#!/bin/bash

# Install all common shadcn/ui components for MVP
components=(
  "button"
  "input"
  "card"
  "label"
  "textarea"
  "select"
  "checkbox"
  "radio-group"
  "switch"
  "slider"
  "tabs"
  "dialog"
  "alert"
  "badge"
  "avatar"
  "separator"
  "toast"
  "tooltip"
)

for component in "${components[@]}"; do
  echo "Installing $component..."
  bunx shadcn@latest add "$component" -y
done

echo "All components installed!"
