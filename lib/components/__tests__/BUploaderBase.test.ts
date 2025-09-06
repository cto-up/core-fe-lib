import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BUploaderBase from '../BUploaderBase.vue'

describe('BUploaderBase', () => {
  it('renders properly', () => {
    const wrapper = mount(BUploaderBase, {
      props: {
        hasContent: false,
        uploading: false,
        progress: 0,
        hasError: false,
        multiple: false
      }
    })
    
    expect(wrapper.find('.uploader-base-container').exists()).toBe(true)
    expect(wrapper.find('.upload-zone').exists()).toBe(true)
  })

  it('shows upload prompt when no content', () => {
    const wrapper = mount(BUploaderBase, {
      props: {
        hasContent: false,
        uploading: false
      },
      slots: {
        prompt: '<div class="test-prompt">Upload files</div>'
      }
    })
    
    expect(wrapper.find('.upload-prompt').exists()).toBe(true)
    expect(wrapper.find('.test-prompt').exists()).toBe(true)
  })

  it('shows content when hasContent is true', () => {
    const wrapper = mount(BUploaderBase, {
      props: {
        hasContent: true,
        uploading: false
      },
      slots: {
        content: '<div class="test-content">File uploaded</div>'
      }
    })
    
    expect(wrapper.find('.content-display').exists()).toBe(true)
    expect(wrapper.find('.test-content').exists()).toBe(true)
  })

  it('shows loading overlay when uploading', () => {
    const wrapper = mount(BUploaderBase, {
      props: {
        hasContent: false,
        uploading: true,
        loadingText: 'Uploading...'
      }
    })
    
    expect(wrapper.find('.loading-overlay').exists()).toBe(true)
    expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    expect(wrapper.text()).toContain('Uploading...')
  })

  it('shows progress when progress > 0', () => {
    const wrapper = mount(BUploaderBase, {
      props: {
        hasContent: false,
        uploading: true,
        progress: 0.5
      }
    })
    
    expect(wrapper.find('.progress-overlay').exists()).toBe(true)
    expect(wrapper.find('.progress-fill').exists()).toBe(true)
    expect(wrapper.text()).toContain('50%')
  })

  it('applies error class when hasError is true', () => {
    const wrapper = mount(BUploaderBase, {
      props: {
        hasContent: false,
        uploading: false,
        hasError: true
      }
    })
    
    expect(wrapper.find('.upload-zone.error').exists()).toBe(true)
  })

  it('emits file-selected event', async () => {
    const wrapper = mount(BUploaderBase)
    const fileInput = wrapper.find('input[type="file"]')
    
    await fileInput.trigger('change')
    
    expect(wrapper.emitted('file-selected')).toBeTruthy()
  })

  it('emits zone-click event', async () => {
    const wrapper = mount(BUploaderBase)
    const uploadZone = wrapper.find('.upload-zone')
    
    await uploadZone.trigger('click')
    
    expect(wrapper.emitted('zone-click')).toBeTruthy()
  })
})
