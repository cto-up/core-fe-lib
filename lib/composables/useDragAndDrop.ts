// src/composables/useDragAndDrop.js
import { ref } from 'vue';

const draggedItem = ref(null);
const originalContainer = ref(null);
export function useDragAndDrop() {

  const targetIndex = ref(null); // Track where the item would be inserted

  const isDragOver = ref(false);

  const startDrag = (event, item, container) => {
    draggedItem.value = item;
    originalContainer.value = container;
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(item));

    const img = new Image();
    img.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==";
    event.dataTransfer.setDragImage(img, 0, 0);

    // Set a custom drag preview (optional)
    const dragImage = event.target.cloneNode(true);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-9999px';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    setDragCursor(true)
  };

  const onDrop = (event, targetContainer) => {
    event.preventDefault();
    setDragCursor(false)
    isDragOver.value = false;
    if (draggedItem.value && originalContainer.value) {
      // Remove from original container
      const index = originalContainer.value.indexOf(draggedItem.value);
      if (index > -1) {
        originalContainer.value.splice(index, 1);
      }
      // Add to new container
      // Add to new container at the target index
      if (targetIndex.value !== null) {
        console.log('ADDED: ', targetIndex.value);
        targetContainer.splice(targetIndex.value, 0, draggedItem.value);
      } else {
        console.log('ADDED ??? ');
        targetContainer.push(draggedItem.value);
      }
    }
     // Reset drag state
     draggedItem.value = null;
     originalContainer.value = null;
     targetIndex.value = null;
     console.log('RESET INDEX: ');
  };

  const onDragOver = (event,targetContainer, index) => {
    event.preventDefault();
    isDragOver.value = true;
    targetIndex.value = index; // Update the target index
    console.log('INDEX: ', index);

  };

  const onDragLeave = () => {
    isDragOver.value = false;
    targetIndex.value = null;
    console.log('DRAG LEAVE INDEX: ');
  };
  const setDragCursor = isDragging => {
    const html = document.getElementsByTagName('html').item(0)
    html.classList.toggle('grabbing', isDragging)
    document.body.classList.toggle('grabbing', isDragging);

  }

  const onDragEnd = () => {
    setDragCursor(false); // Reset cursor on cancel
    isDragOver.value = false;
    targetIndex.value = null;
    console.log('DRAP END INDEX: ');
  };


  return {
    isDragOver,
    targetIndex,
    draggedItem,
    startDrag,
    onDrop,
    onDragOver,
    onDragEnd,
    onDragLeave,
  };
}
