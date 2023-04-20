<script setup lang='ts'>
import { ref } from 'vue'
import { NSpace } from 'naive-ui'
interface Props {
}

defineProps<Props>()

const qrcodeUrl = ref('')

// 创建WebSocket对象
const ws = new WebSocket('wss://www.jiongxiao.com/login');

ws.addEventListener('open', () => {
  ws.send('get_qrcode');
});

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)
  switch (data.type) {
    case 'qrcode':
      qrcodeUrl.value = data.url;
      break;
    default:
      // 其他情况...
      break;
  }
});
ws.addEventListener('close', () => {
  console.log('WebSocket connection closed.');
});
ws.addEventListener('error', (event) => {
  console.error('WebSocket connection error:', event);
});
</script>

<template>
  <NSpace justify="center">
    <iframe width="300" height="400" :src="qrcodeUrl" />
  </NSpace>
</template>
